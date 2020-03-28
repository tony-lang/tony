import { TypeConstructor } from '../types'

export class Binding {
  private _name: string
  private _type: TypeConstructor
  private _isExported: boolean
  private _isImplicit: boolean

  constructor(
    name: string,
    type: TypeConstructor,
    isImplicit = false,
    isExported = false
  ) {
    this._name = name
    this._type = type
    this._isExported = isExported
    this._isImplicit = isImplicit
  }

  get name(): string {
    return this._name
  }

  get type(): TypeConstructor {
    return this._type
  }

  get isExported(): boolean {
    return this._isExported
  }

  get isImplicit(): boolean {
    return this._isImplicit
  }
}
