import {
  AbstractionBranchNode,
  AssignmentNode,
  BlockNode,
  ExportNode,
  ExternalExportNode,
  GeneratorNode,
  IdentifierPatternNameNode,
  IdentifierPatternNode,
  ImportNode,
  ListComprehensionNode,
  ModuleNode,
  ProgramNode,
  ShorthandMemberPatternNode,
  SyntaxNode,
  SyntaxType,
  TypeDeclarationNode,
  WhenNode,
} from 'tree-sitter-tony'
import { Path } from '../types'
import { buildBinding } from '../types/analyze/bindings'
import {
  buildNestedScope,
  buildSymbolTable,
  isModuleScope,
  isSymbolTable,
  NestedScope,
  SymbolTable,
} from '../types/analyze/scopes'
import {
  buildDuplicateBindingError,
  buildExportOutsideModuleScopeError,
  buildImportOutsideFileScopeError,
  buildUnknownImportError,
  ErrorAnnotation,
} from '../types/errors/annotations'
import { assert } from '../types/errors/internal'
import { buildRelativePath, fileMayBeImported } from '../util/file_system'
import { parseStringPattern } from '../util/literals'

type CurrentScope = SymbolTable | NestedScope
type AnalyzeErrorAnnotation = {
  node: SyntaxNode
  error: ErrorAnnotation
}
type State = {
  filePath: Path
  dependencies: Path[]
  errors: AnalyzeErrorAnnotation[]
  // A stack of all scopes starting with the closest scope and ending with the
  // symbol table. Scopes are collected recursively.
  scopesStack: CurrentScope[]
  // When enabled the next created scope will be a module with the given name.
  nextModuleScopeName?: string
  // When enabled the next declared bindings will be exported.
  exportNextBindings?: boolean
  // When enabled the next declared bindings will be imported from the given
  // path.
  importNextBindingsFrom?: Path
  // When enabled the next bindings stemming from identifier patterns will be
  // implicit.
  nextIdentifierPatternBindingsImplicit?: boolean
}

export const constructSymbolTable = (
  filePath: Path,
  node: ProgramNode,
): SymbolTable => {
  const initialSymbolTable = buildSymbolTable()
  const initialState: State = {
    filePath,
    dependencies: [],
    errors: [],
    scopesStack: [initialSymbolTable],
  }

  const {
    scopesStack: [symbolTable],
  } = traverse(initialState, node)
  assert(
    isSymbolTable(symbolTable),
    'Traverse should arrive at the top-level file scope.',
  )

  return symbolTable
}

const addDependency = (path: Path) =>
  ensure(
    () => fileMayBeImported(path),
    (state) => ({
      ...state,
      dependencies: [...state.dependencies, path],
    }),
    buildUnknownImportError(path),
  )

const addError = (state: State, error: AnalyzeErrorAnnotation): State => ({
  ...state,
  errors: [...state.errors, error],
})

// Checks predicate. If true, returns callback. Else, adds error annotation.
const ensure = <T extends SyntaxNode>(
  predicate: (state: State, node: T) => boolean,
  callback: (state: State, node: T) => State,
  error: ErrorAnnotation,
) => (state: State, node: T) => {
  if (predicate(state, node)) return callback(state, node)

  return addError(state, { node, error })
}

const enterBlock = (state: State): State => {
  const { nextModuleScopeName: moduleName } = state
  const scope = buildNestedScope(moduleName)

  return {
    ...state,
    nextModuleScopeName: undefined,
    scopesStack: [scope, ...state.scopesStack],
  }
}

const leaveBlock = (state: State): State => {
  const [scope, parentScope, ...parentScopes] = state.scopesStack

  assert(
    !isSymbolTable(scope) && parentScope !== undefined,
    'Cannot leave file-level scope.',
  )

  return {
    ...state,
    scopesStack: [
      {
        ...parentScope,
        scopes: [...parentScope.scopes, scope],
      },
      ...parentScopes,
    ],
  }
}

// Merges the two most low-level scopes into one.
const reduceScopes = (state: State): State => {
  const [scope, ...parentScopes] = state.scopesStack

  assert(
    scope.scopes.length === 1,
    'Scopes may only be reduced when the parent only has a single nested scope.',
  )

  const [childScope] = scope.scopes
  const newScope = {
    ...scope,
    bindings: [...childScope.bindings, ...scope.bindings],
    scopes: childScope.scopes,
  }

  return {
    ...state,
    scopesStack: [newScope, ...parentScopes],
  }
}

const nest = <T extends SyntaxNode>(
  callback: (state: State, node: T) => State,
  shallow = false,
) => (state: State, node: T) => {
  const nestedState = enterBlock(state)
  const updatedState = callback(nestedState, node)

  if (shallow) {
    // Merges the created scope with the scope of the nested block.
    const reducedState = reduceScopes(updatedState)

    return leaveBlock(reducedState)
  }
  return leaveBlock(updatedState)
}

const addBinding = (
  name: string,
  isImplicit: boolean,
  isExported = false,
  importedFrom?: Path,
) =>
  ensure(
    (state) =>
      !state.scopesStack[0].bindings.find((binding) => binding.name === name),
    (state, node) => {
      const [scope, ...parentScopes] = state.scopesStack
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
        scopesStack: [newScope, ...parentScopes],
      }
    },
    buildDuplicateBindingError(name),
  )

const getIdentifierName = (node: IdentifierPatternNameNode): string => node.text

const getTypeName = (node: TypeDeclarationNode): string => node.nameNode.text

const traverseAll = (state: State, nodes: SyntaxNode[]): State =>
  nodes.reduce((acc, child) => traverse(acc, child), state)

const traverseAllChildren = (state: State, node: SyntaxNode): State =>
  traverseAll(state, node.namedChildren)

const traverse = (state: State, node: SyntaxNode): State => {
  if (!node.isNamed) return state

  // TODO: build import bindings (identifier_pattern, import_clause_identifier_pair, import_clause_type_pair, type)
  switch (node.type) {
    case SyntaxType.AbstractionBranch:
      return handleAbstractionBranch(state, node)
    case SyntaxType.Assignment:
      return handleAssignment(state, node)
    case SyntaxType.Block:
      return handleBlock(state, node)
    case SyntaxType.Export:
      return handleExport(state, node)
    case SyntaxType.ExternalExport:
      return handleImportAndExternalExport(true)(state, node)
    case SyntaxType.Generator:
      return handleGenerator(state, node)
    case SyntaxType.IdentifierPattern:
      return handleIdentifierPatternAndShorthandMemberPattern(state, node)
    case SyntaxType.Import:
      return handleImportAndExternalExport(false)(state, node)
    case SyntaxType.ListComprehension:
      return handleListComprehension(state, node)
    case SyntaxType.Module:
      return handleModule(state, node)
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
  return traverse(nestedStateWithParameters, node.bodyNode)
}, true)

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

const handleBlock = nest<BlockNode>(traverseAllChildren)

const handleExport = ensure<ExportNode>(
  (state) => isModuleScope(state.scopesStack[0]),
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

const handleImportAndExternalExport = (isExported: boolean) =>
  ensure<ImportNode | ExternalExportNode>(
    (state) => isSymbolTable(state.scopesStack[0]),
    (state, node) => {
      const source = parseStringPattern(node.sourceNode)
      const sourcePath = buildRelativePath(state.filePath, source)

      const stateWithDependency = addDependency(sourcePath)(
        state,
        node.sourceNode,
      )
      const stateWithBindings = traverseAll(
        {
          ...stateWithDependency,
          exportNextBindings: isExported,
          importNextBindingsFrom: sourcePath,
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

const handleIdentifierPatternAndShorthandMemberPattern = (
  state: State,
  node: IdentifierPatternNode | ShorthandMemberPatternNode,
): State => {
  const name = getIdentifierName(node.nameNode)
  const {
    exportNextBindings: isExported,
    nextIdentifierPatternBindingsImplicit: isImplicit,
  } = state
  return addBinding(name, !!isImplicit, isExported)(state, node)
}

const handleListComprehension = nest<ListComprehensionNode>((state, node) => {
  const nestedStateWithGenerators = traverseAll(state, node.generatorNodes)
  return traverse(nestedStateWithGenerators, node.bodyNode)
}, true)

const handleModule = (state: State, node: ModuleNode): State => {
  const name = getTypeName(node.nameNode)
  const { exportNextBindings: isExported } = state
  const stateWithBody = traverse(
    {
      ...state,
      nextModuleScopeName: name,
      exportNextBindings: undefined,
    },
    node.bodyNode,
  )

  return addBinding(name, false, isExported)(stateWithBody, node)
}

const handleWhen = nest<WhenNode>((state, node) => {
  // TODO: expect all patterns to define the same bindings, don't throw duplicate binding errors across multiple patterns
  const nestedStateWithAssignments = traverseAll(
    {
      ...state,
      nextIdentifierPatternBindingsImplicit: true,
    },
    node.patternNodes,
  )
  return traverse(
    {
      ...nestedStateWithAssignments,
      nextIdentifierPatternBindingsImplicit: undefined,
    },
    node.bodyNode,
  )
}, true)
