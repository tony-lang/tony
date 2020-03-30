import { CurriedType } from './CurriedType'
import { Type } from './Type'
import { TypeConstraints } from './TypeConstraints'
import { TypeVariable } from './TypeVariable'
import { UnificationError } from './UnificationError'

export class ParametricType extends Type {
  private _name: string
  private _parameters: Type[]

  constructor(name: string, parameters: Type[] = []) {
    super()

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

  unify = (type: Type, constraints: TypeConstraints): Type => {
    if (type instanceof TypeVariable) {
      constraints.add(type, this)
      return this
    } else if (type instanceof ParametricType && this.name === type.name &&
               this.parameters.length == type.parameters.length) {
      const parameters = this.parameters.map((parameter, i) => {
        return parameter.unify(type.parameters[i], constraints)
      })

      return new ParametricType(this.name, parameters)
    }

    throw new UnificationError(this, type, 'Non-variable types do not match')
  }

  applyConstraints = (constraints: TypeConstraints): Type => {
    const parameters = this.parameters
      .map(parameter => parameter.applyConstraints(constraints))

    return new ParametricType(this.name, parameters)
  }

  isComplete = (): boolean =>
    this.parameters.every(parameter => parameter.isComplete())

  toString = (): string => {
    const parameters = this.parameters
      .map(parameter => parameter.toString())
    const combinedParameters =
      parameters.length > 0 ? `<${parameters.join(', ')}>` : ''

    return `${this.name}${combinedParameters}`
  }
}
