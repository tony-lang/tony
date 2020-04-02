import { Type } from '../types'

export class Binding {
  private _name: string
  protected _type: Type
  private _isExported: boolean
  private _isImplicit: boolean

  constructor(
    name: string,
    type: Type,
    isImplicit: boolean,
    isExported: boolean,
  ) {
    this._name = name
    this._type = type
    this._isExported = isExported
    this._isImplicit = isImplicit
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

  get isExported(): boolean {
    return this._isExported
  }

  get isImplicit(): boolean {
    return this._isImplicit
  }
}
