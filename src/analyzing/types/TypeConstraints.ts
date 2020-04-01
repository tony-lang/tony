import { Type } from './Type'
import { TypeVariable } from './TypeVariable'

export class TypeConstraints {
  private _map = new Map<string, Type>()

  has = (variable: TypeVariable): boolean => this._map.has(variable.name)

  resolve = (variable: TypeVariable): Type => {
    const type = this._map.get(variable.name)

    if (type instanceof TypeVariable && this.has(type))
      return this.resolve(type)

    return type
  }

  add = (variable: TypeVariable, type: Type): void => {
    if (this.has(variable)) {
      this.resolve(variable).unify(type, this)
      return
    }
    if (type instanceof TypeVariable && this.has(type)) {
      this.resolve(type).unify(variable, this)
      return
    }

    this._map.set(variable.name, type)
  }
}
