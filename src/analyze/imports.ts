import * as Source from 'tree-sitter-tony/tony'
import * as Declaration from 'tree-sitter-tony/dtn'
import { Dependency, buildDependency } from '../types/analyze/dependencies'
import { isFileScope } from '../types/analyze/scopes'
import {
  buildImportOutsideFileScopeError,
  buildUnknownFileError,
} from '../types/errors/annotations'
import { assert } from '../types/errors/internal'
import { AbsolutePath, buildRelativePath } from '../types/path'
import { buildPromise } from '../util'
import { getIdentifierName, getTypeName, parseRawString } from '../util/parse'
import { addError, ensureAsync } from '../util/traverse'
import { resolveRelativePath } from './resolve'
import { AbstractState } from './types'
import { fileMayBeImported } from '../util/paths'
import {
  addTypeBinding,
  flushTermBindings,
  handleIdentifierPatternName,
} from './util'
import { ImportedTypeBindingNode } from '../types/analyze/bindings'

type ImportNode =
  | Declaration.ImportNode
  | Source.ImportNode
  | Source.ExportedImportNode
type ImportMemberNode = Source.ImportIdentifierNode | ImportedTypeBindingNode

const addDependency = <T extends AbstractState>(
  state: T,
  dependency: Dependency,
): T => {
  const [fileScope] = state.scopes

  assert(
    isFileScope(fileScope),
    'Dependencies may only be added to a file-level scope.',
  )

  const newFileScope = {
    ...fileScope,
    dependencies: [...fileScope.dependencies, dependency],
  }
  return {
    ...state,
    scopes: [newFileScope],
  }
}

export const handleImports = async <T extends AbstractState>(
  state: T,
  nodes: ImportNode[],
) =>
  nodes.reduce<Promise<T>>(
    async (acc, child) => handleImport(await acc, child),
    buildPromise(state),
  )

const handleImport = <T extends AbstractState>(state: T, node: ImportNode) =>
  ensureAsync<T, ImportNode>(
    (state) => isFileScope(state.scopes[0]),
    async (state, node) => {
      const source = buildRelativePath(
        state.file,
        '..',
        parseRawString(node.sourceNode),
      )
      const resolvedSource = await resolveRelativePath(
        state.config,
        source,
        fileMayBeImported,
      )
      if (resolvedSource === undefined)
        return addError(state, node.sourceNode, buildUnknownFileError(source))

      const dependency = buildDependency(resolvedSource)
      const stateWithDependency = addDependency(state, dependency)
      const stateWithBindings = traverseImports(
        {
          ...stateWithDependency,
          exportNextBindings: node.type === Source.SyntaxType.ExportedImport,
          importNextBindingsFrom: { dependency },
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
  )(state, node)

const traverseImports = <T extends AbstractState>(
  state: T,
  nodes: ImportMemberNode[],
): T => nodes.reduce((acc, child) => traverseImport(acc, child), state)

const traverseImport = <T extends AbstractState>(
  state: T,
  node: ImportMemberNode,
): T => {
  switch (node.type) {
    case Source.SyntaxType.ImportIdentifier:
      return handleImportIdentifier(state, node)
    case Declaration.SyntaxType.ImportType:
    case Source.SyntaxType.ImportType:
      return handleImportType(state, node)
  }
}

const handleImportIdentifier = <T extends AbstractState>(
  state: T,
  node: Source.ImportIdentifierNode,
): T => {
  const { importNextBindingsFrom } = state

  assert(
    importNextBindingsFrom !== undefined,
    'Within an import statement, there should be an import config.',
  )

  const originalName = node.nameNode && getIdentifierName(node.nameNode)
  return handleIdentifierPatternName(
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

const handleImportType = <T extends AbstractState>(
  state: T,
  node: ImportedTypeBindingNode,
): T => {
  const {
    exportNextBindings: isExported,
    importNextBindingsFrom: importedFrom,
  } = state
  const originalName = node.nameNode && getTypeName(node.nameNode)
  const name = getTypeName(node.asNode)

  assert(
    importedFrom !== undefined,
    'Within an import statement, there should be an import config.',
  )

  return addTypeBinding(name, isExported, {
    ...importedFrom,
    originalName,
  })(state, node)
}
