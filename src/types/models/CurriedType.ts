import { TypeError, assert } from '../../errors'
import { Type } from './Type'
import { TypeConstraints } from './TypeConstraints'
import { TypeVariable } from './TypeVariable'
import { UnionType } from './UnionType'
import { INTERNAL_PARTIAL_APPLICATION_TYPE_NAME, VOID_TYPE } from '..'
import { ParametricType } from './ParametricType'

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

  disj = (type: Type, constraints: TypeConstraints): Type => {
    try {
      return this.unify(type, constraints)
    } catch (error) {
      if (!(error instanceof TypeError)) throw error
    }

    if (type instanceof UnionType) return type.disj(this, constraints)
    else return new UnionType([this, type])
  }

  apply = (argumentTypes: CurriedType, constraints: TypeConstraints): Type => {
    constraints = new TypeConstraints
    const parameterTypes = this._apply(this.parameters.slice(0), argumentTypes, constraints)

    if (parameterTypes.length == 1)
      return parameterTypes[0]._reduce(constraints)
    else return new CurriedType(parameterTypes)._reduce(constraints)
  }

  private _apply = (parameterTypes: Type[], argumentTypes: CurriedType, constraints: TypeConstraints): Type[] => {
    // handle too many arguments
    if (parameterTypes.length <= argumentTypes.parameters.length)
      throw new TypeError(
        new CurriedType(parameterTypes.slice(0, -1)),
        argumentTypes,
        `Applied ${argumentTypes.parameters.length} arguments to a curried ` +
          `type accepting at most ${parameterTypes.length - 1} arguments.`,
      )

    return parameterTypes.reduce((parameterTypes: Type[], parameterType: Type, i: number): Type[] => {
      const argumentType = argumentTypes.parameters[i]
      if (argumentType === undefined || CurriedType.isPlaceholderArgument(argumentType))
        return parameterTypes.concat([parameterType])

      try {
        parameterType.unify(argumentType, constraints)
      } catch (error) {
        if (error instanceof TypeError)
          error.addTypeMismatch(
            new CurriedType(parameterTypes.slice(0, -1)),
            argumentTypes,
          )
        throw error
      }

      return parameterTypes
    }, [])
  }

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

  private static isPlaceholderArgument = (argumentType: Type): boolean =>
    argumentType instanceof TypeVariable &&
    argumentType.name === INTERNAL_PARTIAL_APPLICATION_TYPE_NAME
}
