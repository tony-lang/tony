import { Property } from './Property'
import { Type } from './Type'

export class IdentifierProperty implements Property {
  private _name: string
  protected _type: Type

  constructor(name: string, type: Type) {
    this._name = name
    this._type = type
  }

  get name(): string {
    return this._name
  }

  get type(): Type {
    return this._type
  }

  set type(value: Type) {
    this._type = value
  }

  toString = (): string => {
    if (this.type === undefined) return this.name

    const type = this.type.toString()
    return `${this.name}: ${type}`
  }
}
