import { Binding } from './Binding'
import { assert } from '../../errors'

export class Scope {
  private _bindings: Binding[] = []
  private _parentScope: Scope | undefined
  private _scopes: Scope[] = []

  constructor(parentScope: Scope | undefined) {
    this._parentScope = parentScope
  }

  get bindings(): Binding[] {
    return this._bindings
  }

  get parentScope(): Scope | undefined {
    return this._parentScope
  }

  createScope = (): Scope => {
    const scope = new Scope(this)

    this._scopes.push(scope)
    return scope
  }

  resolveBinding = (name: string, depth?: number): Binding | undefined => {
    const binding = this.bindings.find((binding) => binding.name === name)
    if (binding) return binding

    assert(
      this._parentScope !== undefined,
      'Parent scope not allowed to be undefined in nested scope.',
    )

    if (depth === undefined) return this._parentScope.resolveBinding(name)
    else if (depth > 0) return this._parentScope.resolveBinding(name, depth - 1)
  }

  addBinding = (binding: Binding): void => {
    this._bindings = [binding, ...this.bindings]
  }

  get exportedBindings(): Binding[] {
    return this.bindings.filter((binding) => binding.isExported)
  }

  // takes the last nested scope and merges it with the current scope
  reduce = (): void => {
    assert(
      this._scopes.length == 1,
      'Scopes may only be reduced when the parent only has a single nested ' +
        'scope.',
    )

    const mergingScope = this._scopes.pop()!
    mergingScope._scopes.map((scope) => (scope._parentScope = this))

    this._bindings = [...this.bindings, ...mergingScope.bindings]
    this._scopes = [...this._scopes, ...mergingScope._scopes]
  }

  nestedScope(index: number): Scope {
    return this._scopes[index]
  }

  get lastNestedScope(): Scope {
    return this._scopes[this._scopes.length - 1]
  }
}
