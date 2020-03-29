import { Type } from './Type'
import { TypeVariable } from './TypeVariable'
import { UnificationError } from './UnificationError'

export class CurriedType extends Type {
  private _parameters: Type[]

  constructor(parameters: Type[], isOptional = false) {
    super(isOptional)

    this._parameters = parameters
  }

  get parameters(): Type[] {
    return this._parameters
  }

  concat = (type: Type): CurriedType =>
    new CurriedType(this.parameters.concat(type))

  unify = (type: Type): Type => {
    if (type instanceof TypeVariable) return this
    if (type instanceof CurriedType &&
        this.parameters.length == type.parameters.length) {
      const parameters = this.parameters
        .map((parameter, i) => parameter.unify(type.parameters[i]))

      return new CurriedType(parameters)
    }

    throw new UnificationError(this, type, 'Non-variable types do not match')
  }

  isComplete = (): boolean =>
    this.parameters.every(parameter => parameter.isComplete())

  toString = (): string => {
    const parameters = this.parameters
      .map(parameter => parameter.toString())
      .join(' -> ')
    const optional = this.isOptional ? '?' : ''

    return `(${parameters})${optional}`
  }
}
