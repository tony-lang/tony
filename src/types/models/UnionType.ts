import { TypeError, assert } from '../../errors'
import { CurriedType } from './CurriedType'
import { Type } from './Type'
import { TypeConstraints } from './TypeConstraints'
import { TypeVariable } from './TypeVariable'

export class UnionType extends Type {
  private _parameters: Type[]

  constructor(parameters: Type[]) {
    super()

    assert(parameters.length > 1, 'Union type should have at least two type parameters.')

    this._parameters = parameters
  }

  get parameters(): Type[] {
    return this._parameters
  }

  concat = (type: Type): CurriedType => {
    if (type instanceof CurriedType) return type.concat(this)

    return new CurriedType([this, type])
  }

  disj = (type: Type, constraints: TypeConstraints): Type => {
    if (type instanceof UnionType)
      return new UnionType(this.mergeParameters(type.parameters, constraints))
    else
      return new UnionType(this.mergeParameters([type], constraints))
  }

  private mergeParameters = (parameters: Type[], constraints: TypeConstraints): Type[] =>
    [...this.parameters, ...parameters].reduce((parameters: Type[], parameter) => {
      for (const [i, otherParameter] of parameters.entries())
        try {
          parameters[i] = parameter.unify(otherParameter, constraints)
          return parameters
        } catch (error) {
          if (!(error instanceof TypeError)) throw error
        }

      return [...parameters, parameter]
    }, [])

  apply = (argumentTypes: CurriedType, constraints: TypeConstraints): Type => {
    for (const parameter of this.parameters)
      try {
        return parameter.apply(argumentTypes, constraints)
      } catch (error) {
        if (!(error instanceof TypeError)) throw error
      }

    throw new TypeError(this, argumentTypes, 'Cannot apply to a non-curried union type.')
  }

  unify = (actual: Type, constraints: TypeConstraints): Type =>
    this._unify(actual, constraints)._reduce(constraints)

  _unify = (actual: Type, constraints: TypeConstraints): Type => {
    if (actual instanceof TypeVariable) {
      constraints.add(actual, this)
      return this
    } else if (actual instanceof Type)
      for (const parameter of this.parameters)
        try {
          return parameter.unify(actual, constraints)
        } catch (error) {
          if (!(error instanceof TypeError)) throw error
        }

    throw new TypeError(this, actual, 'Does not match union type')
  }

  _reduce = (constraints: TypeConstraints): Type => {
    const parameters = this.parameters.map((parameter) =>
      parameter._reduce(constraints),
    )

    if (parameters.length == 1) return parameters[0]
    else return new UnionType(parameters)
  }

  toString = (): string => {
    const parameters = this.parameters
      .map((parameter) => parameter.toString())
      .join(' | ')

    return `(${parameters})`
  }
}
