import { Binding, BindingKind, Bindings } from '../types/analyze/bindings'
import { ConcreteScope, FileScope, ScopeStack } from '../types/analyze/scopes'

const findBindingInScope = (
  kind: BindingKind,
  name: string,
  scope: ConcreteScope,
) => scope.bindings[kind].find((binding) => binding.name === name)

export const findBinding = <T extends FileScope>(
  kind: BindingKind,
  name: string,
  scopes: ScopeStack<T>,
) =>
  scopes.reduce<Binding | undefined>((binding, scope) => {
    if (binding !== undefined) return binding

    return findBindingInScope(kind, name, scope)
  }, undefined)

export const addBinding = (binding: Binding, bindings: Bindings): Bindings => ({
  ...bindings,
  [binding.kind]: [...bindings[binding.kind], binding],
})
