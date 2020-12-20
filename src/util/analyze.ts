import { Binding, BindingKind, Bindings } from '../types/analyze/bindings'
import {
  ConcreteScope,
  FileScope,
  NestedScope,
  ScopeStack,
} from '../types/analyze/scopes'
import { AbsolutePath } from '../types/paths'
import { ErrorAnnotation } from '../types/errors/annotations'
import { SyntaxNode } from 'tree-sitter-tony'
import { isSamePath } from './paths'

export const findItemByName = <T extends { name: string }>(
  name: string,
  items: T[],
): T | undefined => items.find((item) => item.name === name)

const find = <T extends FileScope, U>(
  findInScope: (
    name: string,
  ) => (acc: U | undefined, scope: T | NestedScope) => U | undefined,
) => (name: string, scopes: ScopeStack<T>) =>
  scopes.reduce(findInScope(name), undefined)

const findBinding = <T extends FileScope, U extends Binding>(
  resolveBindings: (bindings: Bindings) => U[],
) =>
  find<T, U>((name) => (binding, scope) => {
    if (binding !== undefined) return binding

    return findItemByName(name, resolveBindings(scope.bindings))
  })

export const findTermBinding = findBinding((bindings) => bindings.terms)
export const findTypeBinding = findBinding((bindings) => bindings.types)

export const findBindingOfKind = (
  kind: BindingKind,
): ((name: string, scopes: ScopeStack<FileScope>) => Binding | undefined) => {
  switch (kind) {
    case BindingKind.Term:
      return findTermBinding
    case BindingKind.Type:
      return findTypeBinding
  }
}

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
