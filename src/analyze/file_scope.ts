import { AbsolutePath, buildRelativePath } from '../types/paths'
import {
  AbstractionBranchNode,
  AssignmentNode,
  BlockNode,
  DestructuringPatternNode,
  EnumNode,
  EnumValueNode,
  ExportNode,
  ExternalImportNode,
  GeneratorNode,
  IdentifierNode,
  IdentifierPatternNameNode,
  IdentifierPatternNode,
  ImportIdentifierNode,
  ImportNode,
  ImportTypeNode,
  InterfaceNode,
  ListComprehensionNode,
  ModuleNode,
  NamedTypeNode,
  ProgramNode,
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
  Binding,
  ImportBindingConfig,
  buildBinding,
  buildImportBindingConfig,
} from '../types/analyze/bindings'
import {
  ErrorAnnotation,
  buildDuplicateBindingError,
  buildDuplicateTypeVariableError,
  buildExportOutsideModuleScopeError,
  buildImportOutsideFileScopeError,
  buildIncompleteWhenPatternError,
  buildMissingBindingError,
  buildMissingTypeVariableError,
  buildUnknownImportError,
} from '../types/errors/annotations'
import {
  FileScope,
  ScopeStack,
  buildFileScope,
  buildNestedScope,
  isFileScope,
  isModuleScope,
} from '../types/analyze/scopes'
import {
  bindingsMissingFrom,
  findBinding,
  findItem,
  findTypeVariable,
} from '../util/analyze'
import { Config } from '../config'
import { assert } from '../types/errors/internal'
import { buildTypeVariable } from '../types/analyze/type_variables'
import { fileMayBeImported } from '../util/paths'
import { parseStringPattern } from '../util/literals'
import { resolveRelativePath } from './resolve'
import { addError, conditionalApply, ensure } from '../util/traverse'

type State = {
  config: Config
  file: AbsolutePath
  /**
   * A stack of all scopes starting with the closest scope and ending with the
   * symbol table. Scopes are collected recursively.
   */
  scopes: ScopeStack<FileScope>
  /**
   * Buffered bindings that have been defined but should not be accessed yet
   * (e.g. within patterns).
   */
  bindings: Binding[]
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
    bindings: [],
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

const enterBlock = (
  state: State,
  node: SyntaxNode,
  moduleName?: string,
): State => {
  const scope = buildNestedScope(node, moduleName)
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
  moduleName?: string,
) => (state: State, node: T) => {
  const nestedState = enterBlock(state, node, moduleName)
  const updatedState = callback(nestedState, node)
  return leaveBlock(updatedState)
}

const flushBindings = (state: State): State => {
  const [scope, ...parentScopes] = state.scopes
  const newScope = {
    ...scope,
    bindings: [...scope.bindings, ...state.bindings],
  }
  return {
    ...state,
    scopes: [newScope, ...parentScopes],
    bindings: [],
  }
}

const addBinding = <T extends SyntaxNode>(
  name: string,
  isImplicit: boolean,
  isExported = false,
  importedFrom?: ImportBindingConfig,
) =>
  ensure<State, T>(
    (state) =>
      findBinding(name, state.scopes) === undefined &&
      findItem(name, state.bindings) === undefined,
    (state, node) => {
      const binding = buildBinding(
        name,
        node,
        isImplicit,
        isExported,
        importedFrom,
      )
      return {
        ...state,
        bindings: [...state.bindings, binding],
      }
    },
    buildDuplicateBindingError(name),
  )

const addTypeVariable = (name: string) =>
  ensure<State, TypeVariableDeclarationNode>(
    (state) => findTypeVariable(name, state.scopes) === undefined,
    (state, node) => {
      const [scope, ...parentScopes] = state.scopes
      assert(
        !isFileScope(scope),
        'Type variables may only be declared within type declarations.',
      )
      const typeVariable = buildTypeVariable(name, node)
      const newScope = {
        ...scope,
        typeVariables: [...scope.typeVariables, typeVariable],
      }
      return {
        ...state,
        scopes: [newScope, ...parentScopes],
      }
    },
    buildDuplicateTypeVariableError(name),
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
    case SyntaxType.ExternalImport:
      return handleImportAndExternalImport(true)(state, node)
    case SyntaxType.Generator:
      return handleGenerator(state, node)
    case SyntaxType.Identifier:
      return handleIdentifier(state, node)
    case SyntaxType.IdentifierPattern:
      return handleIdentifierPatternAndShorthandMemberPattern(state, node)
    case SyntaxType.Import:
      return handleImportAndExternalImport(false)(state, node)
    case SyntaxType.ImportIdentifier:
      return handleImportIdentifier(state, node)
    case SyntaxType.ImportType:
      return handleImportType(state, node)
    case SyntaxType.Interface:
      return handleInterface(state, node)
    case SyntaxType.ListComprehension:
      return handleListComprehension(state, node)
    case SyntaxType.Module:
      return handleModule(state, node)
    case SyntaxType.NamedType:
      return handleNamedType(state, node)
    case SyntaxType.ShorthandMemberPattern:
      return handleIdentifierPatternAndShorthandMemberPattern(state, node)
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
  const stateWithTypeParameters = conditionalApply(traverse)(
    state,
    node.type_parametersNode,
  )
  const stateWithParameters = traverse(
    stateWithTypeParameters,
    node.parametersNode,
  )
  const stateWithFlushedBindings = flushBindings(stateWithParameters)
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
  const stateWithFlushedBindings = flushBindings(stateWithBindings)
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
  const stateWithBinding = addBinding(
    name,
    false,
    isExported,
  )(stateWithAlias, node)
  return traverse(stateWithBinding, node.patternNode)
}

const handleEnum = (state: State, node: EnumNode): State => {
  const [isExported, stateWithoutExport] = exportAndReset(state)
  const name = getTypeName(node.nameNode)
  const stateWithName = traverse(stateWithoutExport, node.nameNode)
  const stateWithValues = traverseAll(stateWithName, node.valueNodes)
  const stateWithBinding = addBinding(
    name,
    false,
    isExported,
  )(stateWithValues, node)
  return flushBindings(stateWithBinding)
}

const handleEnumValue = (state: State, node: EnumValueNode): State => {
  const name = getTypeName(node.nameNode)
  const stateWithName = traverse(state, node.nameNode)
  const stateWithBinding = addBinding(name, false, true)(stateWithName, node)
  const stateWithFlushedBinding = flushBindings(stateWithBinding)
  return conditionalApply(traverse)(stateWithFlushedBinding, node.valueNode)
}

const handleExport = ensure<State, ExportNode>(
  (state) => isModuleScope(state.scopes[0]),
  (state, node) =>
    traverse(
      {
        ...state,
        exportNextBindings: true,
      },
      node.declarationNode,
    ),
  buildExportOutsideModuleScopeError(),
)

const handleImportAndExternalImport = (isExported: boolean) =>
  ensure<State, ImportNode | ExternalImportNode>(
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
        return addError(state, node.sourceNode, buildUnknownImportError(source))

      const stateWithDependency = addDependency(state, resolvedSource)
      const stateWithBindings = traverseAll(
        {
          ...stateWithDependency,
          exportNextBindings: isExported,
          importNextBindingsFrom: buildImportBindingConfig(resolvedSource),
        },
        node.importNodes,
      )
      const stateWithFlushedBindings = flushBindings(stateWithBindings)
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
  const stateWithBinding = addBinding(name, true)(stateWithValue, node)
  const stateWithFlushedBinding = flushBindings(stateWithBinding)
  return conditionalApply(traverse)(stateWithFlushedBinding, node.conditionNode)
}

const handleIdentifier = (state: State, node: IdentifierNode): State => {
  const name = getIdentifierName(node)
  const binding = findBinding(name, state.scopes)

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
  return addBinding(
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

  return addBinding(name, false, isExported, {
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
  return flushBindings(
    addBinding(name, false, isExported)(stateWithMembers, node),
  )
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

const handleModule = (state: State, node: ModuleNode): State => {
  const [isExported, stateWithoutExport] = exportAndReset(state)
  const name = getTypeName(node.nameNode.nameNode)
  const stateWithName = traverse(stateWithoutExport, node.nameNode)

  return nest<ModuleNode>((state, node) => {
    const stateWithBody = traverse(
      {
        ...state,
        nextBlockScopeAlreadyCreated: true,
      },
      node.bodyNode,
    )
    return flushBindings(
      addBinding(name, false, isExported)(stateWithBody, node),
    )
  }, name)(stateWithName, node)
}

const handleNamedType = (state: State, node: NamedTypeNode): State => {
  const { exportNextBindings: isExported } = state
  const name = getTypeName(node.nameNode)
  const stateWithName = traverse(state, node.nameNode)
  const stateWithType = traverse(stateWithName, node.typeNode)
  return flushBindings(addBinding(name, false, isExported)(stateWithType, node))
}

const handleTypeAlias = nest<TypeAliasNode>((state, node) => {
  const { exportNextBindings: isExported } = state
  const name = getTypeName(node.nameNode.nameNode)
  const stateWithName = traverse(state, node.nameNode)
  const stateWithType = traverse(stateWithName, node.typeNode)
  const stateWithFlushedBinding = flushBindings(
    addBinding(name, false, isExported)(stateWithType, node),
  )
  return { ...stateWithFlushedBinding, exportNextBindings: undefined }
})

const handleTypeVariable = (state: State, node: TypeVariableNode): State => {
  const name = getTypeVariableName(node)
  const typeVariable = findTypeVariable(name, state.scopes)

  if (typeVariable) return state
  return addError(state, node, buildMissingTypeVariableError(name))
}

const handleTypeVariableDeclaration = (
  state: State,
  node: TypeVariableDeclarationNode,
): State => {
  const name = getTypeVariableName(node.nameNode)
  const stateWithName = traverse(state, node.nameNode)
  const stateWithTypeVariable = addTypeVariable(name)(stateWithName, node)
  return conditionalApply(traverse)(stateWithTypeVariable, node.constraintNode)
}

const handleWhen = nest<WhenNode>((state, node) => {
  // Build temporary scopes around patterns.
  const statesWithBindings = node.patternNodes.map((patternNode) => {
    const nestedState = enterBlock(state, patternNode)
    return flushBindings(
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
        scope.bindings,
        accScope.bindings,
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
