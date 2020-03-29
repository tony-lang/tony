import { CurriedType } from './CurriedType'
import { Type } from './Type'
import { TypeVariable } from './TypeVariable'
import { UnificationError } from './UnificationError'

export class ParametricType extends Type {
  private _name: string
  private _parameters: Type[]

  constructor(name: string, parameters: Type[] = [], isOptional = false) {
    super(isOptional)

    this._name = name
    this._parameters = parameters
  }

  get name(): string {
    return this._name
  }

  get parameters(): Type[] {
    return this._parameters
  }

  concat = (type: Type): CurriedType => {
    if (type instanceof CurriedType) return type.concat(this)

    return new CurriedType([this, type])
  }

  unify = (type: Type): Type => {
    if (type instanceof TypeVariable) return this
    if (type instanceof ParametricType && this.name === type.name &&
        this.parameters.length == type.parameters.length) {
      const parameters = this.parameters
        .map((parameter, i) => parameter.unify(type.parameters[i]))

      return new ParametricType(this.name, parameters)
    }

    throw new UnificationError(this, type, 'Non-variable types do not match')
  }

  isComplete = (): boolean =>
    this.parameters.every(parameter => parameter.isComplete())

  toString = (): string => {
    const parameters = this.parameters
      .map(parameter => parameter.toString())
    const combinedParameters =
      parameters.length > 0 ? `<${parameters.join(', ')}>` : ''
    const optional = this.isOptional ? '?' : ''

    return `${this.name}${combinedParameters}${optional}`
  }
}
