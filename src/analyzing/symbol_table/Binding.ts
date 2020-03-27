import { TypeConstructor } from '../types'

export class Binding {
  private _name: string
  private _type: TypeConstructor
  private _isExported: boolean

  constructor(name: string, type: TypeConstructor, isExported = false) {
    this._name = name
    this._type = type
    this._isExported = isExported
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
}
