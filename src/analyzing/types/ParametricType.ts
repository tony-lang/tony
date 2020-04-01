import { assert, TypeError } from '../../errors'

import { CurriedType } from './CurriedType'
import { Type } from './Type'
import { TypeConstraints } from './TypeConstraints'
import { TypeVariable } from './TypeVariable'

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

  unify = (actual: Type, constraints: TypeConstraints): ParametricType =>
    this._unify(actual, constraints)._reduce(constraints)

  _unify = (actual: Type, constraints: TypeConstraints): ParametricType => {
    if (actual instanceof TypeVariable) {
      constraints.add(actual, this)
      return this
    } else if (actual instanceof ParametricType && this.name === actual.name &&
               this.parameters.length == actual.parameters.length) {
      const parameters = this.parameters.map((parameter, i) => {
        try {
          return parameter._unify(actual.parameters[i], constraints)
        } catch (error) {
          assert(
            error instanceof TypeError,
            'Should be TypeError.'
          )

          error.addTypeMismatch(this, actual)
          throw error
        }
      })

      return new ParametricType(this.name, parameters)
    }

    throw new TypeError(this, actual, 'Non-variable types do not match')
  }

  _reduce = (constraints: TypeConstraints): ParametricType => {
    const parameters = this.parameters
      .map(parameter => parameter._reduce(constraints))

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
