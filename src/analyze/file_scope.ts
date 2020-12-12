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
import { Config } from '../config'
import { BindingKind, buildBinding } from '../types/analyze/bindings'
import {
  buildFileScope,
  buildNestedScope,
  FileScope,
  isFileScope,
  isModuleScope,
  NestedScope,
  ScopeStack,
} from '../types/analyze/scopes'
import {
  MountedErrorAnnotation,
  buildDuplicateBindingError,
  buildExportOutsideModuleScopeError,
  buildImportOutsideFileScopeError,
  buildUnknownImportError,
  ErrorAnnotation,
} from '../types/errors/annotations'
import { assert } from '../types/errors/internal'
import { AbsolutePath, buildRelativePath, RelativePath } from '../types/paths'
import { fileMayBeImported } from '../util/file_system'
import { parseStringPattern } from '../util/literals'
import { addBinding, findBinding } from '../util/analyze'
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
  importNextBindingsFrom?: AbsolutePath
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

const addDependency = (
  relativePath: RelativePath,
  absolutePath: AbsolutePath | undefined,
) =>
  ensure(
    () => absolutePath !== undefined && fileMayBeImported(absolutePath),
    (state) => {
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
    },
    buildUnknownImportError(relativePath),
  )

const addError = (state: State, error: MountedErrorAnnotation): State => {
  const [scope, ...parentScopes] = state.scopes

  return {
    ...state,
    scopes: [
      {
        ...scope,
        errors: [...scope.errors, error],
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

  return addError(state, { node, error })
}

const enterBlock = (state: State): State => {
  const { nextModuleScopeName: moduleName } = state
  const scope = buildNestedScope(moduleName)

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
  const nestedState = enterBlock(state)
  const updatedState = callback(nestedState, node)
  return leaveBlock(updatedState)
}

const declareBinding = (
  kind: BindingKind,
  name: string,
  isImplicit: boolean,
  isExported = false,
  importedFrom?: AbsolutePath,
) =>
  ensure(
    (state) => findBinding(kind, name, state.scopes) === undefined,
    (state, node) => {
      const [scope, ...parentScopes] = state.scopes
      const binding = buildBinding(
        kind,
        name,
        node,
        isImplicit,
        isExported,
        importedFrom,
      )
      const newScope = {
        ...scope,
        bindings: addBinding(binding, scope.bindings),
      }

      return {
        ...state,
        scopes: [newScope, ...parentScopes],
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

const handleImportAndExternalExport = (isExported: boolean) =>
  ensure<ImportNode | ExternalExportNode>(
    (state) => isFileScope(state.scopes[0]),
    (state, node) => {
      const source = buildRelativePath(
        state.file,
        '..',
        parseStringPattern(node.sourceNode),
      )
      const resolvedSource = resolveRelativePath(state.config, source)

      const stateWithDependency = addDependency(source, resolvedSource)(
        state,
        node.sourceNode,
      )
      const stateWithBindings = traverseAll(
        {
          ...stateWithDependency,
          exportNextBindings: isExported,
          importNextBindingsFrom: resolvedSource,
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
  const stateWithBinding = declareBinding(
    BindingKind.Term,
    name,
    true,
  )(stateAfterValue, node)

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
  return declareBinding(
    BindingKind.Term,
    name,
    !!isImplicit,
    isExported,
  )(state, node)
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

  return declareBinding(
    BindingKind.Term,
    name,
    false,
    isExported,
  )(stateWithBody, node)
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
      nextBlockScopeAlreadyCreated: true,
    },
    node.bodyNode,
  )
})
