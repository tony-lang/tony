import { TypeError, assert } from '../../errors'
import { CurriedType } from './CurriedType'
import { Type } from './Type'
import { TypeConstraints } from './TypeConstraints'
import { TypeVariable } from './TypeVariable'

export class UnionType extends Type {
  private _parameters: Type[]

  constructor(parameters: Type[]) {
    super()

    assert(
      parameters.length > 1,
      'Union type should have at least two type parameters.',
    )

    this._parameters = parameters
  }

  get parameters(): Type[] {
    return this._parameters
  }

  concat = (type: Type): CurriedType => {
    if (type instanceof CurriedType) return type.concat(this)

    return new CurriedType([this, type])
  }

  disj = (type: Type, constraints?: TypeConstraints): Type => {
    if (type instanceof UnionType)
      return new UnionType(this.mergeParameters(type.parameters, constraints))
    else return new UnionType(this.mergeParameters([type], constraints))
  }

  private mergeParameters = (
    parameters: Type[],
    constraints?: TypeConstraints,
  ): Type[] => {
    const combinedParameters = [...this.parameters, ...parameters]
    if (constraints === undefined) return combinedParameters

    return combinedParameters.reduce(
      (parameters: Type[], parameter) =>
        parameters.reduce((parameters: Type[], otherParameter) => {
          const unifiedParameter = Type.attemptWithTmpConstraints(
            parameter.unify,
            otherParameter,
            constraints,
          )
          if (unifiedParameter) return [...parameters, unifiedParameter]

          return [...parameters, otherParameter, parameter]
        }, []),
      [],
    )
  }

  apply = (argumentTypes: CurriedType, constraints: TypeConstraints): Type => {
    const parameters = this.parameters.reduce(
      (parameters: Type[], parameter) => {
        const appliedType = Type.attemptWithTmpConstraints(
          parameter.apply,
          argumentTypes,
          constraints,
        )
        if (appliedType) return [...parameters, appliedType]

        return parameters
      },
      [],
    )

    if (parameters.length > 1) return new UnionType(parameters)
    else if (parameters.length == 1) return parameters[0]
    else
      throw new TypeError(
        this,
        argumentTypes,
        'Cannot apply to a non-curried union type.',
      )
  }

  unify = (actual: Type, constraints: TypeConstraints): Type =>
    this._unify(actual, constraints)._reduce(constraints)

  _unify = (actual: Type, constraints: TypeConstraints): Type => {
    if (actual instanceof TypeVariable) {
      constraints.add(actual, this)
      return this
    }
    const parameters = this.parameters.reduce(
      (parameters: Type[], parameter) => {
        const unifiedParameter = Type.attemptWithTmpConstraints(
          parameter.unify,
          actual,
          constraints,
        )
        if (unifiedParameter) return [...parameters, unifiedParameter]

        return parameters
      },
      [],
    )

    if (parameters.length > 1) return new UnionType(parameters)
    else if (parameters.length == 1) return parameters[0]
    else throw new TypeError(this, actual, 'Does not match union type')
  }

  _reduce = (constraints: TypeConstraints): Type => {
    const parameters = this.parameters.map((parameter) =>
      parameter._reduce(constraints),
    )

    return new UnionType(parameters)
  }

  toString = (): string => {
    const parameters = this.parameters
      .map((parameter) => parameter.toString())
      .join(' | ')

    return `(${parameters})`
  }
}
