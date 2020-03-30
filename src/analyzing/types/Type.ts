import { CurriedType } from './CurriedType'
import { TypeConstraints } from './TypeConstraints'

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

  abstract unify: (type: Type, constraints: TypeConstraints) => Type
  abstract applyConstraints: (constraints: TypeConstraints) => Type

  abstract isComplete: () => boolean
  abstract toString: () => string
}
