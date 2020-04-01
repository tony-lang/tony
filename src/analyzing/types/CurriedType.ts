import { assert, UnificationError } from '../../errors'

import { Type } from './Type'
import { TypeConstraints } from './TypeConstraints'
import { TypeVariable } from './TypeVariable'

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

  unify = (actual: Type, constraints: TypeConstraints): CurriedType => {
    if (actual instanceof TypeVariable) {
      constraints.add(actual, this)
      return this
    } else if (actual instanceof CurriedType &&
               this.parameters.length == actual.parameters.length) {
      const parameters = this.parameters.map((parameter, i) => {
        try {
          return parameter.unify(actual.parameters[i], constraints)
        } catch (error) {
          assert(
            error instanceof UnificationError,
            'Should be UnificationError.'
          )

          error.addTypeMismatch(this, actual)
          throw error
        }
      })

      return new CurriedType(parameters)
    }

    throw new UnificationError(this, actual, 'Non-variable types do not match')
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
