import { BASIC_TYPES, ParametricType } from '../../types'
import { DuplicateBindingError, assert } from '../../errors'
import { BasicTypeBinding } from './BasicTypeBinding'
import { Binding } from './Binding'
import { BindingTemplate } from './BindingTemplate'
import { IdentifierBinding } from './IdentifierBinding'
import { Scope } from './Scope'

const OVERLOADED_BINDINGS = Object.freeze([IdentifierBinding])

export class NestedScope extends Scope {
  private _bindings: Binding[] = []
  private _bindingTemplates: BindingTemplate[] = []
  private _parentScope: Scope

  constructor(parentScope: Scope) {
    super()

    this._parentScope = parentScope
  }

  get bindings(): Binding[] {
    return this._bindings
  }

  get bindingTemplates(): BindingTemplate[] {
    return this._bindingTemplates
  }

  get parentScope(): Scope {
    return this._parentScope
  }

  addNestedScope = (scope: NestedScope): NestedScope => {
    scope._parentScope = this

    this._scopes = [...this._scopes, scope]
    return scope
  }

  resolveBinding = (
    name: string,
    depth?: number,
  ): Binding | BindingTemplate | undefined => {
    // TODO: remove this when basic types are implemented in Tony
    const matchingBasicType = BASIC_TYPES.find((type) => type === name)
    if (matchingBasicType)
      return new BasicTypeBinding(new ParametricType(matchingBasicType))

    const binding = this.bindings.find((binding) => binding.name === name)
    if (binding) return binding

    const bindingTemplate = this.bindingTemplates.find(
      (bindingTemplate) => bindingTemplate.name === name,
    )
    if (bindingTemplate) return bindingTemplate

    if (this.parentScope instanceof NestedScope)
      if (depth === undefined) return this.parentScope.resolveBinding(name)
      else if (depth > 0)
        return this.parentScope.resolveBinding(name, depth - 1)
  }

  resolveBindings = (
    name: string,
    depth?: number,
  ): (Binding | BindingTemplate)[] => {
    const bindings = [
      ...this.bindings.filter((binding) => binding.name === name),
      ...this.bindingTemplates.filter(
        (bindingTemplate) => bindingTemplate.name === name,
      ),
    ]

    if (this.parentScope instanceof NestedScope)
      if (depth === undefined)
        return this.filterTemplateBindings([
          ...bindings,
          ...this.parentScope.resolveBindings(name),
        ])
      else if (depth > 0)
        return this.filterTemplateBindings([
          ...bindings,
          ...this.parentScope.resolveBindings(name, depth - 1),
        ])

    return this.filterTemplateBindings(bindings)
  }

  // removes templates for which there are already actual bindings, depends on bindings being in front of templates
  private filterTemplateBindings = (
    bindings: (Binding | BindingTemplate)[],
  ): (Binding | BindingTemplate)[] =>
    bindings.reduce((newBindings: (Binding | BindingTemplate)[], binding) => {
      if (
        newBindings.find((otherBinding) => binding.node === otherBinding.node)
      )
        return newBindings
      else return [...newBindings, binding]
    }, [])

  isBound = (name: string, depth?: number): boolean => {
    if (this.resolveBinding(name, 0)) return true

    if (this.parentScope instanceof NestedScope)
      if (depth === undefined) return this.parentScope.isBound(name)
      else if (depth > 0) return this.parentScope.isBound(name, depth - 1)

    return false
  }

  addBinding = (binding: Binding): void => {
    if (!OVERLOADED_BINDINGS.find((type) => binding instanceof type)) {
      const matchingBinding = this.resolveBinding(binding.name, 0)
      if (matchingBinding) throw new DuplicateBindingError(binding.name)
    }

    this._bindings = [binding, ...this.bindings]
  }

  removeBinding = (binding: Binding): void => {
    const index = this.bindings.indexOf(binding)
    if (index < 0) return

    this._bindings = [
      ...this.bindings.slice(0, index),
      ...this.bindings.slice(index + 1),
    ]
  }

  addBindingTemplate = (bindingTemplate: BindingTemplate): void => {
    this._bindingTemplates = [bindingTemplate, ...this.bindingTemplates]
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
    this._bindingTemplates = [
      ...this.bindingTemplates,
      ...scope.bindingTemplates,
    ]
    this._scopes = scope._scopes
  }

  nestedScope(index: number): NestedScope | undefined {
    return this._scopes[index]
  }

  get lastNestedScope(): NestedScope | undefined {
    return this._scopes[this._scopes.length - 1]
  }
}
