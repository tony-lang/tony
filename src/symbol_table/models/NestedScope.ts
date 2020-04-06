import { BASIC_TYPES, ParametricType } from '../../types'
import { BasicTypeBinding } from './BasicTypeBinding'
import { Binding } from './Binding'
import { Scope } from './Scope'
import { assert } from '../../errors'

export class NestedScope extends Scope {
  private _bindings: Binding[] = []
  private _parentScope: Scope

  constructor(parentScope: Scope) {
    super()

    this._parentScope = parentScope
  }

  get bindings(): Binding[] {
    return this._bindings
  }

  get parentScope(): Scope {
    return this._parentScope
  }

  addNestedScope = (scope: NestedScope): NestedScope => {
    scope._parentScope = this

    this._scopes = [...this._scopes, scope]
    return scope
  }

  resolveBinding = (name: string, depth?: number): Binding | undefined => {
    // TODO: remove this when basic types are implemented in Tony
    const matchingBasicType = BASIC_TYPES.find((type) => type === name)
    if (matchingBasicType)
      return new BasicTypeBinding(new ParametricType(matchingBasicType))

    const binding = this.bindings.find((binding) => binding.name === name)
    if (binding) return binding

    if (this.parentScope instanceof NestedScope)
      if (depth === undefined) return this.parentScope.resolveBinding(name)
      else if (depth > 0)
        return this.parentScope.resolveBinding(name, depth - 1)
  }

  addBinding = (binding: Binding): void => {
    this._bindings = [binding, ...this.bindings]
  }

  // takes the last nested scope and merges it with the current scope
  reduce = (): void => {
    assert(
      this._scopes.length == 1,
      'Scopes may only be reduced when the parent only has a single nested ' +
        'scope.',
    )

    const [scope] = this._scopes
    scope._scopes.map((nestedScope) => (nestedScope._parentScope = this))

    this._bindings = [...this.bindings, ...scope.bindings]
    this._scopes = scope._scopes
  }

  nestedScope(index: number): NestedScope {
    return this._scopes[index]
  }

  get lastNestedScope(): NestedScope {
    return this._scopes[this._scopes.length - 1]
  }
}
