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

    const binding = this._bindings.find(binding => binding.name === name)
    if (binding) return binding

    if (depth === null) return this._parentScope.resolveBinding(name)
    else if (depth > 0) return this._parentScope.resolveBinding(name, depth - 1)
  }

  addBinding = (binding: Binding): void => {
    this._bindings = [binding, ...this._bindings]
  }

  getExportedBindingTypes = (): Map<string, TypeConstructor> => {
    const result = new Map<string, TypeConstructor>()

    this._bindings.forEach(binding => {
      if (!binding.isExported) return

      result.set(binding.name, binding.type)
    })

    return result
  }

  protected get bindings(): Binding[] {
    return this._bindings
  }

  get parentScope(): Scope {
    return this._parentScope
  }
}
