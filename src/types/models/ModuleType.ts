import { Binding, BindingTemplate, ModuleScope } from '../../symbol_table'
import { InternalError } from '../../errors'
import { Type } from './Type'

export class ModuleType extends Type {
  private _scope: ModuleScope

  constructor(scope: ModuleScope) {
    super()

    this._scope = scope
  }

  get scope(): ModuleScope {
    return this._scope
  }

  get properties(): Binding[] {
    return this.scope.bindings.filter((binding) => binding.isExported)
  }

  resolveProperty = (name: string): (Binding | BindingTemplate)[] =>
    this.scope.resolveBindings(name, 0).filter((binding) => binding.isExported)

  unsafeUnify = (): Type => {
    throw new InternalError('Module types may not be unified.')
  }

  reduce = (): Type => {
    throw new InternalError('Module types may not be reduced.')
  }

  equals = (type: Type): boolean => this === type

  toString = (): string => {
    if (this.properties.length == 0) return '{}'

    const properties = this.properties
      .map((binding) => binding.toString())
      .join(', ')

    return `{ ${properties} }`
  }
}
