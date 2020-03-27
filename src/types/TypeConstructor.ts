import { CurriedTypeConstructor } from './CurriedTypeConstructor'
import { TypeInterface } from './TypeInterface'

export abstract class TypeConstructor implements TypeInterface {
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

  abstract get length(): number
  abstract concat: (
    typeConstructor: TypeConstructor,
    merge?: boolean
  ) => CurriedTypeConstructor
  abstract matches: (pattern: TypeInterface) => boolean
  abstract isValid: () => boolean
  abstract toString: () => string
}
