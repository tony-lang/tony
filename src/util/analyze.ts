import { Binding, Bindings } from '../types/analyze/bindings'
import { FileScope, NestedScope, ScopeStack } from '../types/analyze/scopes'

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

const findBinding = <T extends Binding>(
  resolveBindings: (bindings: Bindings) => T[],
) =>
  find((name) => (binding: T | undefined, scope) => {
    if (binding !== undefined) return binding

    return findItemByName(name, resolveBindings(scope.bindings))
  })

export const findTermBinding = findBinding((bindings) => bindings.terms)
export const findTypeBinding = findBinding((bindings) => bindings.types)

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
