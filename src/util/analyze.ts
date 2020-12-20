import {
  Binding,
  Bindings,
  getTerms,
  getTypes,
} from '../types/analyze/bindings'
import { ConcreteScope, FileScope, NestedScope } from '../types/analyze/scopes'
import { AbsolutePath } from '../types/paths'
import { ErrorAnnotation } from '../types/errors/annotations'
import { SyntaxNode } from 'tree-sitter-tony'
import { isSamePath } from './paths'

export const findItemByName = <T extends { name: string }>(
  name: string,
  items: T[],
): T | undefined => items.find((item) => item.name === name)

const find = <T extends FileScope, U extends NestedScope, V>(
  findInScope: (
    name: string,
  ) => (acc: V | undefined, scope: T | U) => V | undefined,
) => (name: string, scopes: (T | U)[]) =>
  scopes.reduce(findInScope(name), undefined)

const findBinding = <T extends Binding>(
  resolveBindings: (bindings: Bindings) => T[],
) =>
  find<FileScope, NestedScope, T>((name) => (binding, scope) => {
    if (binding !== undefined) return binding

    return findItemByName(name, resolveBindings(scope.bindings))
  })

export const findTermBinding = findBinding(getTerms)
export const findTypeBinding = findBinding(getTypes)

/**
 * Returns the bindings (1) is missing from (2).
 */
export const bindingsMissingFrom = (
  bindings1: Binding[],
  bindings2: Binding[],
): Binding[] =>
  bindings2.filter(
    (a) => bindings1.find((b) => a.name === b.name) === undefined,
  )

export const findFileScope = <T extends FileScope>(
  fileScopes: T[],
  file: AbsolutePath,
): T | undefined =>
  fileScopes.find((fileScope) => isSamePath(fileScope.file, file))

export const addErrorToScope = <T extends ConcreteScope>(
  scope: T,
  node: SyntaxNode,
  error: ErrorAnnotation,
): T => ({
  ...scope,
  errors: [...scope.errors, { node, error }],
})
