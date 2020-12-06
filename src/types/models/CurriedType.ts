import { TypeError, assert } from '../../errors'
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

  unify = (actual: Type, constraints: TypeConstraints): CurriedType =>
    this._unify(actual, constraints)._reduce(constraints)

  _unify = (actual: Type, constraints: TypeConstraints): CurriedType => {
    if (actual instanceof TypeVariable) {
      constraints.add(actual, this)
      return this
    } else if (
      actual instanceof CurriedType &&
      this.parameters.length == actual.parameters.length
    ) {
      return new CurriedType(this.unifyParameters(actual, constraints))
    }

    throw new TypeError(this, actual, 'Non-variable types do not match')
  }

  private unifyParameters = (
    actual: CurriedType,
    constraints: TypeConstraints,
  ): Type[] =>
    this.parameters.map((parameter, i) => {
      try {
        return parameter._unify(actual.parameters[i], constraints)
      } catch (error) {
        assert(error instanceof TypeError, 'Should be TypeError.')

        error.addTypeMismatch(this, actual)
        throw error
      }
    })

  _reduce = (constraints: TypeConstraints): CurriedType => {
    const parameters = this.parameters.map((parameter) =>
      parameter._reduce(constraints),
    )

    return new CurriedType(parameters)
  }

  toString = (): string => {
    const parameters = this.parameters
      .map((parameter) => parameter.toString())
      .join(' -> ')

    return `(${parameters})`
  }
}
