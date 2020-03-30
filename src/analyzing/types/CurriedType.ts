import { Type } from './Type'
import { TypeConstraints } from './TypeConstraints'
import { TypeVariable } from './TypeVariable'
import { UnificationError } from './UnificationError'

export class CurriedType extends Type {
  private _parameters: Type[]

  constructor(parameters: Type[]) {
    super()

    this._parameters = parameters
  }

  get parameters(): Type[] {
    return this._parameters
  }

  concat = (type: Type): CurriedType =>
    new CurriedType(this.parameters.concat(type))

  unify = (type: Type, constraints: TypeConstraints): Type => {
    if (type instanceof TypeVariable) {
      constraints.add(type, this)
      return this
    } else if (type instanceof CurriedType &&
               this.parameters.length == type.parameters.length) {
      const parameters = this.parameters.map((parameter, i) => {
        return parameter.unify(type.parameters[i], constraints)
      })

      return new CurriedType(parameters)
    }

    throw new UnificationError(this, type, 'Non-variable types do not match')
  }

  applyConstraints = (constraints: TypeConstraints): Type => {
    const parameters = this.parameters
      .map(parameter => parameter.applyConstraints(constraints))

    return new CurriedType(parameters)
  }

  isComplete = (): boolean =>
    this.parameters.every(parameter => parameter.isComplete())

  toString = (): string => {
    const parameters = this.parameters
      .map(parameter => parameter.toString())
      .join(' -> ')

    return `(${parameters})`
  }
}
