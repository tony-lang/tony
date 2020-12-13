import { Binding } from '../types/analyze/bindings'
import { ConcreteScope, FileScope, ScopeStack } from '../types/analyze/scopes'

const findBindingInScope = (name: string, scope: ConcreteScope) =>
  scope.bindings.find((binding) => binding.name === name)

export const findBinding = <T extends FileScope>(
  name: string,
  scopes: ScopeStack<T>,
) =>
  scopes.reduce<Binding | undefined>((binding, scope) => {
    if (binding !== undefined) return binding

    return findBindingInScope(name, scope)
  }, undefined)

// Returns the bindings (1) is missing from (2).
export const bindingsMissingFrom = (
  bindings1: Binding[],
  bindings2: Binding[],
): Binding[] =>
  bindings2.filter(
    (a) => bindings1.find((b) => a.name === b.name) === undefined,
  )
