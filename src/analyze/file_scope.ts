import { AbsolutePath, buildRelativePath } from '../types/paths'
import {
  AbstractionBranchNode,
  AssignmentNode,
  BlockNode,
  DestructuringPatternNode,
  EnumNode,
  EnumValueNode,
  ExportNode,
  ExportedImportNode,
  GeneratorNode,
  IdentifierNode,
  IdentifierPatternNameNode,
  IdentifierPatternNode,
  ImportIdentifierNode,
  ImportNode,
  ImportTypeNode,
  InterfaceNode,
  ListComprehensionNode,
  NamedTypeNode,
  ProgramNode,
  RefinementTypeDeclarationNode,
  RefinementTypeNode,
  ShorthandMemberPatternNode,
  SyntaxNode,
  SyntaxType,
  TypeAliasNode,
  TypeNode,
  TypeVariableDeclarationNameNode,
  TypeVariableDeclarationNode,
  TypeVariableNode,
  WhenNode,
} from 'tree-sitter-tony'
import {
  FileScope,
  ScopeStack,
  buildFileScope,
  buildNestedScope,
  isFileScope,
} from '../types/analyze/scopes'
import {
  ImportBindingConfig,
  TermBinding,
  buildBindings,
  buildImportBindingConfig,
  buildTermBinding,
  buildTypeBinding,
  getTerms,
} from '../types/analyze/bindings'
import { addError, conditionalApply, ensure } from '../util/traverse'
import {
  bindingsMissingFrom,
  findItemByName,
  findTermBinding,
  findTypeBinding,
} from '../util/analyze'
import {
  buildDuplicateBindingError,
  buildExportOutsideFileScopeError,
  buildImportOutsideFileScopeError,
  buildIncompleteWhenPatternError,
  buildMissingBindingError,
  buildRefinementTypeDeclarationOutsideRefinementTypeError,
  buildUnknownFileError,
} from '../types/errors/annotations'
import { Config } from '../config'
import { assert } from '../types/errors/internal'
import { fileMayBeImported } from '../util/paths'
import { parseStringPattern } from '../util/literals'
import { resolveRelativePath } from './resolve'

type State = {
  config: Config
  file: AbsolutePath
  /**
   * A stack of all scopes starting with the closest scope and ending with the
   * symbol table. Scopes are collected recursively.
   */
  scopes: ScopeStack<FileScope>
  /**
   * Buffered term-level bindings that have been defined but should not be
   * accessed yet (e.g. within patterns).
   */
  termBindings: TermBinding[]
  /**
   * When enabled the next declared bindings will be exported.
   */
  exportNextBindings?: boolean
  /**
   * When enabled the next declared bindings will be imported from the given
   * path.
   */
  importNextBindingsFrom?: ImportBindingConfig
  /**
   * When enabled the next bindings stemming from identifier patterns will be
   * implicit.
   */
  nextIdentifierPatternBindingsImplicit?: boolean
  /**
   * Is set to true when the scope for the next block was already created. Then,
   * no additional scope is created when encountering the next block.
   */
  nextBlockScopeAlreadyCreated?: boolean
}

export const constructFileScope = (
  config: Config,
  file: AbsolutePath,
  node: ProgramNode,
): FileScope => {
  const initialFileScope = buildFileScope(file, node)
  const initialState: State = {
    config,
    file,
    scopes: [initialFileScope],
    termBindings: [],
  }

  const {
    scopes: [fileScope],
  } = traverse(initialState, node)
  assert(
    isFileScope(fileScope),
    'Traverse should arrive at the top-level file scope.',
  )

  return fileScope
}

const addDependency = (state: State, absolutePath: AbsolutePath): State => {
  const [fileScope] = state.scopes

  assert(
    isFileScope(fileScope),
    'Dependencies may only be added to a file-level scope.',
  )

  const newFileScope = {
    ...fileScope,
    dependencies: [...fileScope.dependencies, absolutePath],
  }
  return {
    ...state,
    scopes: [newFileScope],
  }
}

const enterBlock = (state: State, node: SyntaxNode): State => {
  const scope = buildNestedScope(node)
  return {
    ...state,
    scopes: [scope, ...state.scopes],
  }
}

const leaveBlock = (state: State): State => {
  const [scope, parentScope, ...parentScopes] = state.scopes

  assert(
    !isFileScope(scope) && parentScope !== undefined,
    'Cannot leave file-level scope.',
  )

  const newParentScope = {
    ...parentScope,
    scopes: [...parentScope.scopes, scope],
  }
  return {
    ...state,
    scopes: [newParentScope, ...parentScopes],
  }
}

const nest = <T extends SyntaxNode>(
  callback: (state: State, node: T) => State,
) => (state: State, node: T) => {
  const nestedState = enterBlock(state, node)
  const updatedState = callback(nestedState, node)
  return leaveBlock(updatedState)
}

const flushTermBindings = (state: State): State => {
  const [scope, ...parentScopes] = state.scopes
  const newScope = {
    ...scope,
    bindings: buildBindings(scope.bindings, state.termBindings, []),
  }
  return {
    ...state,
    scopes: [newScope, ...parentScopes],
    termBindings: [],
  }
}

const addTermBinding = <T extends SyntaxNode>(
  name: string,
  isImplicit: boolean,
  isExported = false,
  importedFrom?: ImportBindingConfig,
) =>
  ensure<State, T>(
    (state) =>
      findTermBinding(name, state.scopes) === undefined &&
      findItemByName(name, state.termBindings) === undefined,
    (state, node) => {
      const binding = buildTermBinding(
        name,
        node,
        isImplicit,
        isExported,
        importedFrom,
      )
      return {
        ...state,
        termBindings: [...state.termBindings, binding],
      }
    },
    buildDuplicateBindingError(name),
  )

const addTypeBinding = <T extends SyntaxNode>(
  name: string,
  isVariable: boolean,
  isExported = false,
  importedFrom?: ImportBindingConfig,
) =>
  ensure<State, T>(
    (state) => findTypeBinding(name, state.scopes) === undefined,
    (state, node) => {
      const binding = buildTypeBinding(
        name,
        node,
        isVariable,
        isExported,
        importedFrom,
      )
      const [scope, ...parentScopes] = state.scopes
      const newScope = {
        ...scope,
        bindings: buildBindings(scope.bindings, [], [binding]),
      }
      return {
        ...state,
        scopes: [newScope, ...parentScopes],
      }
    },
    buildDuplicateBindingError(name),
  )

const exportAndReset = (
  state: State,
): [isExported: boolean, newState: State] => [
  !!state.exportNextBindings,
  { ...state, exportNextBindings: undefined },
]

const getIdentifierName = (
  node: IdentifierNode | IdentifierPatternNameNode,
): string => node.text

const getTypeName = (node: TypeNode): string => node.text

const getTypeVariableName = (
  node: TypeVariableNode | TypeVariableDeclarationNameNode,
): string => node.text

const traverseAll = (state: State, nodes: SyntaxNode[]): State =>
  nodes.reduce((acc, child) => traverse(acc, child), state)

const traverseAllChildren = (state: State, node: SyntaxNode): State =>
  traverseAll(state, node.namedChildren)

const traverse = (state: State, node: SyntaxNode): State => {
  if (!node.isNamed) return state

  switch (node.type) {
    case SyntaxType.AbstractionBranch:
      return handleAbstractionBranch(state, node)
    case SyntaxType.Assignment:
      return handleAssignment(state, node)
    case SyntaxType.Block:
      return handleBlock(state, node)
    case SyntaxType.DestructuringPattern:
      return handleDestructuringPattern(state, node)
    case SyntaxType.Enum:
      return handleEnum(state, node)
    case SyntaxType.EnumValue:
      return handleEnumValue(state, node)
    case SyntaxType.Export:
      return handleExport(state, node)
    case SyntaxType.ExportedImport:
      return handleImportAndExportedImport(true)(state, node)
    case SyntaxType.Generator:
      return handleGenerator(state, node)
    case SyntaxType.Identifier:
      return handleIdentifier(state, node)
    case SyntaxType.IdentifierPattern:
      return handleIdentifierPatternAndShorthandMemberPattern(state, node)
    case SyntaxType.Import:
      return handleImportAndExportedImport(false)(state, node)
    case SyntaxType.ImportIdentifier:
      return handleImportIdentifier(state, node)
    case SyntaxType.ImportType:
      return handleImportType(state, node)
    case SyntaxType.Interface:
      return handleInterface(state, node)
    case SyntaxType.ListComprehension:
      return handleListComprehension(state, node)
    case SyntaxType.NamedType:
      return handleNamedType(state, node)
    case SyntaxType.ShorthandMemberPattern:
      return handleIdentifierPatternAndShorthandMemberPattern(state, node)
    case SyntaxType.RefinementType:
      return handleRefinementType(state, node)
    case SyntaxType.RefinementTypeDeclaration:
      return handleRefinementTypeDeclaration(state, node)
    case SyntaxType.TypeAlias:
      return handleTypeAlias(state, node)
    case SyntaxType.TypeVariable:
      return handleTypeVariable(state, node)
    case SyntaxType.TypeVariableDeclaration:
      return handleTypeVariableDeclaration(state, node)
    case SyntaxType.When:
      return handleWhen(state, node)
    default:
      return traverseAllChildren(state, node)
  }
}

const handleAbstractionBranch = nest<AbstractionBranchNode>((state, node) => {
  const stateWithTypeParameters = conditionalApply(traverseAll)(
    state,
    node.typeParameterNodes,
  )
  const stateWithParameters = traverseAll(
    stateWithTypeParameters,
    node.elementNodes,
  )
  const stateWithRestParameter = conditionalApply(traverse)(
    stateWithParameters,
    node.restNode,
  )
  const stateWithFlushedBindings = flushTermBindings(stateWithRestParameter)
  return traverse(
    {
      ...stateWithFlushedBindings,
      nextBlockScopeAlreadyCreated: true,
    },
    node.bodyNode,
  )
})

const handleAssignment = (state: State, node: AssignmentNode): State => {
  const stateWithBindings = traverse(state, node.patternNode)
  const stateWithFlushedBindings = flushTermBindings(stateWithBindings)
  return traverse(
    {
      ...stateWithFlushedBindings,
      exportNextBindings: undefined,
    },
    node.valueNode,
  )
}

const handleBlock = (state: State, node: BlockNode): State => {
  const { nextBlockScopeAlreadyCreated: skipNesting } = state

  if (skipNesting)
    return traverseAllChildren(
      {
        ...state,
        nextBlockScopeAlreadyCreated: undefined,
      },
      node,
    )
  else return nest<BlockNode>(traverseAllChildren)(state, node)
}

const handleDestructuringPattern = (
  state: State,
  node: DestructuringPatternNode,
): State => {
  if (node.aliasNode === undefined) return traverse(state, node.patternNode)

  const { exportNextBindings: isExported } = state
  const name = getIdentifierName(node.aliasNode)
  const stateWithAlias = traverse(state, node.aliasNode)
  const stateWithBinding = addTermBinding(
    name,
    false,
    isExported,
  )(stateWithAlias, node)
  return traverse(stateWithBinding, node.patternNode)
}

const handleEnum = (state: State, node: EnumNode): State => {
  const { exportNextBindings: isExported } = state
  const name = getTypeName(node.nameNode)
  const stateWithName = traverse(state, node.nameNode)
  const stateWithValues = traverseAll(stateWithName, node.valueNodes)
  const stateWithBinding = addTypeBinding(
    name,
    false,
    isExported,
  )({ ...stateWithValues, exportNextBindings: false }, node)
  return flushTermBindings(stateWithBinding)
}

const handleEnumValue = (state: State, node: EnumValueNode): State => {
  const { exportNextBindings: isExported } = state
  const name = getIdentifierName(node.nameNode)
  const stateWithName = traverse(state, node.nameNode)
  const stateWithBinding = addTermBinding(
    name,
    false,
    isExported,
  )(stateWithName, node)
  return conditionalApply(traverse)(stateWithBinding, node.valueNode)
}

const handleExport = ensure<State, ExportNode>(
  (state) => isFileScope(state.scopes[0]),
  (state, node) =>
    traverse(
      {
        ...state,
        exportNextBindings: true,
      },
      node.declarationNode,
    ),
  buildExportOutsideFileScopeError(),
)

const handleImportAndExportedImport = (isExported: boolean) =>
  ensure<State, ImportNode | ExportedImportNode>(
    (state) => isFileScope(state.scopes[0]),
    (state, node) => {
      const source = buildRelativePath(
        state.file,
        '..',
        parseStringPattern(node.sourceNode),
      )
      const resolvedSource = resolveRelativePath(
        state.config,
        source,
        fileMayBeImported,
      )
      if (resolvedSource === undefined)
        return addError(state, node.sourceNode, buildUnknownFileError(source))

      const stateWithDependency = addDependency(state, resolvedSource)
      const stateWithBindings = traverseAll(
        {
          ...stateWithDependency,
          exportNextBindings: isExported,
          importNextBindingsFrom: buildImportBindingConfig(resolvedSource),
        },
        node.importNodes,
      )
      const stateWithFlushedBindings = flushTermBindings(stateWithBindings)
      return {
        ...stateWithFlushedBindings,
        exportNextBindings: undefined,
        importNextBindingsFrom: undefined,
      }
    },
    buildImportOutsideFileScopeError(),
  )

const handleGenerator = (state: State, node: GeneratorNode): State => {
  const name = getIdentifierName(node.nameNode)
  const stateWithName = traverse(state, node.nameNode)
  const stateWithValue = traverse(stateWithName, node.valueNode)
  const stateWithBinding = addTermBinding(name, true)(stateWithValue, node)
  const stateWithFlushedBinding = flushTermBindings(stateWithBinding)
  return conditionalApply(traverse)(stateWithFlushedBinding, node.conditionNode)
}

const handleIdentifier = (state: State, node: IdentifierNode): State => {
  const name = getIdentifierName(node)
  const binding = findTermBinding(name, state.scopes)

  if (binding) return state
  return addError(state, node, buildMissingBindingError(name))
}

const handleIdentifierPatternAndShorthandMemberPattern = (
  state: State,
  node: IdentifierPatternNode | ShorthandMemberPatternNode,
): State => {
  const {
    exportNextBindings: isExported,
    nextIdentifierPatternBindingsImplicit: isImplicit,
    importNextBindingsFrom: importedFrom,
  } = state
  const name = getIdentifierName(node.nameNode)
  const stateWithName = traverse(state, node.nameNode)
  const stateWithType = conditionalApply(traverse)(stateWithName, node.typeNode)
  const stateWithDefault = conditionalApply(traverse)(
    stateWithType,
    node.defaultNode,
  )
  return addTermBinding(
    name,
    !!isImplicit,
    isExported,
    importedFrom,
  )(stateWithDefault, node)
}

const handleImportIdentifier = (
  state: State,
  node: ImportIdentifierNode,
): State => {
  const { importNextBindingsFrom } = state

  assert(
    importNextBindingsFrom !== undefined,
    'Within an import statement, there should be an import config.',
  )

  const originalName = node.nameNode
    ? getIdentifierName(node.nameNode)
    : undefined
  const stateWithName = conditionalApply(traverse)(
    {
      ...state,
      importNextBindingsFrom: {
        ...importNextBindingsFrom,
        originalName,
      },
    },
    node.nameNode,
  )

  return traverse(stateWithName, node.asNode)
}

const handleImportType = (state: State, node: ImportTypeNode): State => {
  const {
    exportNextBindings: isExported,
    importNextBindingsFrom: importedFrom,
  } = state
  const originalName = getTypeName(node.nameNode)
  const stateWithName = traverse(state, node.nameNode)
  const name = node.asNode ? getTypeName(node.asNode) : originalName
  const stateWithAs = conditionalApply(traverse)(stateWithName, node.asNode)

  assert(
    importedFrom !== undefined,
    'Within an import statement, there should be an import config.',
  )

  return addTypeBinding(name, false, isExported, {
    ...importedFrom,
    originalName,
  })(stateWithAs, node)
}

const handleInterface = nest<InterfaceNode>((state, node) => {
  const [isExported, stateWithoutExport] = exportAndReset(state)
  const name = getTypeName(node.nameNode.nameNode)
  const stateWithName = traverse(stateWithoutExport, node.nameNode)
  const stateWithMembers = traverseAll(
    {
      ...stateWithName,
      nextBlockScopeAlreadyCreated: true,
    },
    node.memberNodes,
  )
  return addTypeBinding(name, false, isExported)(stateWithMembers, node)
})

const handleListComprehension = nest<ListComprehensionNode>((state, node) => {
  const nestedStateWithGenerators = traverseAll(state, node.generatorNodes)
  return traverse(
    {
      ...nestedStateWithGenerators,
      nextBlockScopeAlreadyCreated: true,
    },
    node.bodyNode,
  )
})

const handleNamedType = (state: State, node: NamedTypeNode): State => {
  const { exportNextBindings: isExported } = state
  const constructor = getIdentifierName(node.nameNode)
  const stateWithName = traverse(state, node.nameNode)
  const stateWithType = traverse(stateWithName, node.typeNode)
  return flushTermBindings(
    addTermBinding(constructor, true, isExported)(stateWithType, node),
  )
}

const handleRefinementType = nest<RefinementTypeNode>((state, node) => {
  const stateWithGenerator = flushTermBindings(
    traverse(state, node.generatorNode),
  )
  return traverseAll(stateWithGenerator, node.predicateNodes)
})

const handleRefinementTypeDeclaration = ensure<
  State,
  RefinementTypeDeclarationNode
>(
  (state) => state.scopes[0].node.type === SyntaxType.RefinementType,
  (state, node) => {
    const name = getIdentifierName(node.nameNode)
    const stateWithConstraints = traverseAll(state, node.constraintNodes)
    return addTermBinding(name, true)(stateWithConstraints, node)
  },
  buildRefinementTypeDeclarationOutsideRefinementTypeError(),
)

const handleTypeAlias = nest<TypeAliasNode>((state, node) => {
  const { exportNextBindings: isExported } = state
  const name = getTypeName(node.nameNode.nameNode)
  const stateWithName = traverse(state, node.nameNode)
  const stateWithType = traverse(stateWithName, node.typeNode)
  const stateWithBinding = addTypeBinding(
    name,
    false,
    isExported,
  )(stateWithType, node)
  return { ...stateWithBinding, exportNextBindings: undefined }
})

const handleTypeVariable = (state: State, node: TypeVariableNode): State => {
  const name = getTypeVariableName(node)
  const binding = findTypeBinding(name, state.scopes)

  if (binding) return state
  return addError(state, node, buildMissingBindingError(name))
}

const handleTypeVariableDeclaration = (
  state: State,
  node: TypeVariableDeclarationNode,
): State => {
  const name = getTypeVariableName(node.nameNode)
  const stateWithName = traverse(state, node.nameNode)
  const stateWithBinding = addTypeBinding(name, true)(stateWithName, node)
  return conditionalApply(traverseAll)(stateWithBinding, node.constraintNodes)
}

const handleWhen = nest<WhenNode>((state, node) => {
  // Build temporary scopes around patterns.
  const statesWithBindings = node.patternNodes.map((patternNode) => {
    const nestedState = enterBlock(state, patternNode)
    return flushTermBindings(
      traverse(
        {
          ...nestedState,
          nextIdentifierPatternBindingsImplicit: true,
        },
        patternNode,
      ),
    )
  })

  // Ensure that all patterns define the same terms.
  const stateWithBindings = statesWithBindings.reduceRight(
    (accState, state, i) => {
      const [accScope, ...parentScopes] = accState.scopes
      const [scope] = state.scopes
      assert(
        !isFileScope(accScope) && !isFileScope(scope),
        'Temporary scopes around `when` patterns should be nested scopes.',
      )

      const missingBindings = bindingsMissingFrom(
        getTerms(scope.bindings),
        getTerms(accScope.bindings),
      )
      if (missingBindings.length > 0)
        return addError(
          accState,
          node.patternNodes[i],
          buildIncompleteWhenPatternError(
            missingBindings.map((binding) => binding.name),
          ),
        )

      return {
        ...accState,
        scopes: [
          {
            ...accScope,
            errors: [...accScope.errors, ...scope.errors],
          },
          ...parentScopes,
        ],
      }
    },
    statesWithBindings[0],
  )

  return traverse(
    {
      ...stateWithBindings,
      nextBlockScopeAlreadyCreated: true,
    },
    node.bodyNode,
  )
})
