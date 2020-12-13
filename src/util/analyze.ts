import {
  FileScope,
  NestedScope,
  ScopeStack,
  isFileScope,
} from '../types/analyze/scopes'
import { Binding } from '../types/analyze/bindings'
import { TypeVariable } from '../types/analyze/type_variables'

export const findItem = <T extends { name: string }>(
  name: string,
  items: T[],
): T | undefined => items.find((item) => item.name === name)

const find = <T extends FileScope, U>(
  findInScope: (
    name: string,
  ) => (acc: U | undefined, scope: T | NestedScope) => U | undefined,
) => (name: string, scopes: ScopeStack<T>) =>
  scopes.reduce(findInScope(name), undefined)

export const findBinding = find(
  (name) => (binding: Binding | undefined, scope) => {
    if (binding !== undefined) return binding

    return findItem(name, scope.bindings)
  },
)

export const findTypeVariable = find(
  (name) => (typeVariable: TypeVariable | undefined, scope) => {
    if (typeVariable !== undefined || isFileScope(scope)) return typeVariable

    return findItem(name, scope.typeVariables)
  },
)

// Returns the bindings (1) is missing from (2).
export const bindingsMissingFrom = (
  bindings1: Binding[],
  bindings2: Binding[],
): Binding[] =>
  bindings2.filter(
    (a) => bindings1.find((b) => a.name === b.name) === undefined,
  )
