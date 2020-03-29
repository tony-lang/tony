import { CurriedType } from './CurriedType'

export abstract class Type {
  private _isOptional: boolean

  constructor(isOptional = false) {
    this._isOptional = isOptional
  }

  get isOptional(): boolean {
    return this._isOptional
  }

  set isOptional(value: boolean) {
    this._isOptional = value
  }

  abstract concat: (type: Type) => CurriedType
  abstract unify: (type: Type) => Type
  abstract isComplete: () => boolean
  abstract toString: () => string
}
