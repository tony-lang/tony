import { assert } from '../../utilities'

import { TypeConstructor, BASIC_TYPES } from '../types'

import { Binding } from './Binding'

export class Scope {
  private _bindings: Binding[] = []
  private _parentScope: Scope
  private _scopes: Scope[] = []

  constructor(parentScope: Scope) {
    this._parentScope = parentScope
  }

  createScope = (): Scope => {
    const scope = new Scope(this)

    this._scopes.push(scope)
    return scope
  }

  resolveBinding = (name: string, depth: number = null): Binding => {
    // TODO: remove this when basic types are implemented in Tony
    const matchingBasicType = BASIC_TYPES.find(type => type.toString() === name)
    if (matchingBasicType) return new Binding(name, matchingBasicType)

    const binding = this.bindings.find(binding => binding.name === name)
    if (binding) return binding

    if (depth === null) return this._parentScope.resolveBinding(name)
    else if (depth > 0) return this._parentScope.resolveBinding(name, depth - 1)
  }

  addBinding = (binding: Binding): void => {
    this._bindings = [binding, ...this.bindings]
  }

  getExportedBindingTypes = (): Map<string, TypeConstructor> => {
    const result = new Map<string, TypeConstructor>()

    this.bindings.forEach(binding => {
      if (!binding.isExported) return

      result.set(binding.name, binding.type)
    })

    return result
  }

  // takes the last nested scope and merges it with the current scope
  reduce = (): void => {
    assert(
      this._scopes.length == 1,
      'Scopes may only be reduced when the parent only has a single nested ' +
      'scope.'
    )

    const mergingScope = this._scopes.pop()

    this._bindings = [...this.bindings, ...mergingScope.bindings]
    this._scopes = [...this._scopes, ...mergingScope._scopes]
  }

  get bindings(): Binding[] {
    return this._bindings
  }

  get parentScope(): Scope {
    return this._parentScope
  }

  nestedScope(index: number): Scope {
    return this._scopes[index]
  }

  get lastNestedScope(): Scope {
    return this._scopes[this._scopes.length - 1]
  }
}
