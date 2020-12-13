import {
  AbstractionBranchNode,
  AssignmentNode,
  BlockNode,
  EnumNode,
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
  TypeNode,
  WhenNode,
} from 'tree-sitter-tony'
import { Config } from '../config'
import {
  buildBinding,
  buildImportBindingConfig,
  ImportBindingConfig,
} from '../types/analyze/bindings'
import {
  buildFileScope,
  buildNestedScope,
  FileScope,
  isFileScope,
  isModuleScope,
  ScopeStack,
} from '../types/analyze/scopes'
import {
  buildDuplicateBindingError,
  buildExportOutsideModuleScopeError,
  buildImportOutsideFileScopeError,
  buildUnknownImportError,
  ErrorAnnotation,
  buildIncompleteWhenPatternError,
  buildMissingBindingError,
} from '../types/errors/annotations'
import { assert } from '../types/errors/internal'
import { AbsolutePath, buildRelativePath } from '../types/paths'
import { fileMayBeImported } from '../util/file_system'
import { parseStringPattern } from '../util/literals'
import { bindingsMissingFrom, findBinding } from '../util/analyze'
import { resolveRelativePath } from './resolve'

type State = {
  config: Config
  file: AbsolutePath
  // A stack of all scopes starting with the closest scope and ending with the
  // symbol table. Scopes are collected recursively.
  scopes: ScopeStack<FileScope>
  // When enabled the next created scope will be a module with the given name.
  nextModuleScopeName?: string
  // When enabled the next declared bindings will be exported.
  exportNextBindings?: boolean
  // When enabled the next declared bindings will be imported from the given
  // path.
  importNextBindingsFrom?: ImportBindingConfig
  // When enabled the next bindings stemming from identifier patterns will be
  // implicit.
  nextIdentifierPatternBindingsImplicit?: boolean
  // Is set to true when the scope for the next block was already created. Then,
  // no additional scope is created when encountering the next block.
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
    absolutePath !== undefined,
    'It should be ensured that the dependency is not undefined.',
  )
  assert(
    isFileScope(fileScope),
    'Dependencies may only be added to a file-level scope.',
  )

  return {
    ...state,
    scopes: [
      {
        ...fileScope,
        dependencies: [...fileScope.dependencies, absolutePath],
      },
    ],
  }
}

const addError = (
  state: State,
  node: SyntaxNode,
  error: ErrorAnnotation,
): State => {
  const [scope, ...parentScopes] = state.scopes

  return {
    ...state,
    scopes: [
      {
        ...scope,
        errors: [...scope.errors, { node, error }],
      },
      ...parentScopes,
    ],
  }
}

// Checks predicate. If true, returns callback. Else, adds error annotation.
const ensure = <T extends SyntaxNode>(
  predicate: (state: State, node: T) => boolean,
  callback: (state: State, node: T) => State,
  error: ErrorAnnotation,
) => (state: State, node: T) => {
  if (predicate(state, node)) return callback(state, node)

  return addError(state, node, error)
}

const enterBlock = (state: State, node: SyntaxNode): State => {
  const { nextModuleScopeName: moduleName } = state
  const scope = buildNestedScope(node, moduleName)

  return {
    ...state,
    nextModuleScopeName: undefined,
    scopes: [scope, ...state.scopes],
  }
}

const leaveBlock = (state: State): State => {
  const [scope, parentScope, ...parentScopes] = state.scopes

  assert(
    !isFileScope(scope) && parentScope !== undefined,
    'Cannot leave file-level scope.',
  )

  return {
    ...state,
    scopes: [
      {
        ...parentScope,
        scopes: [...parentScope.scopes, scope],
      },
      ...parentScopes,
    ],
  }
}

const nest = <T extends SyntaxNode>(
  callback: (state: State, node: T) => State,
) => (state: State, node: T) => {
  const nestedState = enterBlock(state, node)
  const updatedState = callback(nestedState, node)
  return leaveBlock(updatedState)
}

const addBinding = (
  name: string,
  isImplicit: boolean,
  isExported = false,
  importedFrom?: ImportBindingConfig,
) =>
  ensure(
    (state) => findBinding(name, state.scopes) === undefined,
    (state, node) => {
      const [scope, ...parentScopes] = state.scopes
      const binding = buildBinding(
        name,
        node,
        isImplicit,
        isExported,
        importedFrom,
      )
      const newScope = {
        ...scope,
        bindings: [...scope.bindings, binding],
      }

      return {
        ...state,
        scopes: [newScope, ...parentScopes],
      }
    },
    buildDuplicateBindingError(name),
  )

const getIdentifierName = (
  node: IdentifierNode | IdentifierPatternNameNode,
): string => node.text

const getTypeName = (node: TypeNode): string => node.text

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
    case SyntaxType.Enum:
      return handleEnum(state, node)
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
    case SyntaxType.When:
      return handleWhen(state, node)
    default:
      return traverseAllChildren(state, node)
  }
}

const handleAbstractionBranch = nest<AbstractionBranchNode>((state, node) => {
  const nestedStateWithParameters = traverse(state, node.parametersNode)
  return traverse(
    {
      ...nestedStateWithParameters,
      nextBlockScopeAlreadyCreated: true,
    },
    node.bodyNode,
  )
})

const handleAssignment = (state: State, node: AssignmentNode): State => {
  const stateWithBindings = traverse(state, node.patternNode)
  return traverse(
    {
      ...stateWithBindings,
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

const handleEnum = (state: State, node: EnumNode): State => {
  const name = getTypeName(node.nameNode)
  const { exportNextBindings: isExported } = state
  const stateWithBinding = addBinding(name, false, isExported)(state, node)
  return traverseAll(stateWithBinding, node.valueNodes)
}

const handleExport = ensure<ExportNode>(
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
  ensure<ImportNode | ExternalImportNode>(
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
      return {
        ...stateWithBindings,
        exportNextBindings: undefined,
        importNextBindingsFrom: undefined,
      }
    },
    buildImportOutsideFileScopeError(),
  )

const handleGenerator = (state: State, node: GeneratorNode): State => {
  const name = getIdentifierName(node.nameNode)
  const stateAfterValue = traverse(state, node.valueNode)
  const stateWithBinding = addBinding(name, true)(stateAfterValue, node)

  if (node.conditionNode) return traverse(stateWithBinding, node.conditionNode)
  return stateWithBinding
}

const handleIdentifier = (state: State, node: IdentifierNode): State => {
  const name = getIdentifierName(node)
  const binding = findBinding(name, state.scopes)

  if (binding === undefined)
    return addError(state, node, buildMissingBindingError(name))
  return state
}

const handleIdentifierPatternAndShorthandMemberPattern = (
  state: State,
  node: IdentifierPatternNode | ShorthandMemberPatternNode,
): State => {
  const name = getIdentifierName(node.nameNode)
  const {
    exportNextBindings: isExported,
    nextIdentifierPatternBindingsImplicit: isImplicit,
    importNextBindingsFrom: importedFrom,
  } = state
  return addBinding(name, !!isImplicit, isExported, importedFrom)(state, node)
}

const handleImportIdentifier = (
  state: State,
  node: ImportIdentifierNode,
): State => {
  const originalName = node.nameNode
    ? getIdentifierName(node.nameNode)
    : undefined
  const { importNextBindingsFrom } = state

  assert(
    importNextBindingsFrom !== undefined,
    'Within an import statement, there should be an import config.',
  )

  return traverse(
    {
      ...state,
      importNextBindingsFrom: {
        ...importNextBindingsFrom,
        originalName,
      },
    },
    node.asNode,
  )
}

const handleImportType = (state: State, node: ImportTypeNode): State => {
  const originalName = getTypeName(node.nameNode)
  const name = node.asNode ? getTypeName(node.asNode) : originalName
  const {
    exportNextBindings: isExported,
    importNextBindingsFrom: importedFrom,
  } = state

  assert(
    importedFrom !== undefined,
    'Within an import statement, there should be an import config.',
  )

  return addBinding(name, false, isExported, {
    ...importedFrom,
    originalName,
  })(state, node)
}

const handleInterface = (state: State, node: InterfaceNode): State => {
  const name = getTypeName(node.nameNode.nameNode)
  const { exportNextBindings: isExported } = state
  const stateWithBinding = addBinding(name, false, isExported)(state, node)
  return traverseAll(stateWithBinding, node.memberNodes)
}

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
  const name = getTypeName(node.nameNode.nameNode)
  const { exportNextBindings: isExported } = state
  const stateWithBinding = addBinding(name, false, isExported)(state, node)
  return traverse(
    {
      ...stateWithBinding,
      nextModuleScopeName: name,
      exportNextBindings: undefined,
    },
    node.bodyNode,
  )
}

const handleNamedType = (state: State, node: NamedTypeNode): State => {
  const name = getTypeName(node.nameNode)
  const { exportNextBindings: isExported } = state
  const stateWithBinding = addBinding(name, false, isExported)(state, node)
  return traverse(stateWithBinding, node.typeNode)
}

const handleWhen = nest<WhenNode>((state, node) => {
  // Build temporary scopes around patterns.
  const statesWithBindings = node.patternNodes.map((patternNode) => {
    const nestedState = enterBlock(state, patternNode)
    return traverse(
      {
        ...nestedState,
        nextIdentifierPatternBindingsImplicit: true,
      },
      patternNode,
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
