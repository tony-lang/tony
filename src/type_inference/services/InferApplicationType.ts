import {
  CurriedType,
  INTERNAL_PARTIAL_APPLICATION_TYPE_NAME,
  ParametricType,
  Type,
  TypeConstraints,
  TypeVariable,
  VOID_TYPE,
} from '../../types'
import { TypeError } from '../../errors'

export class InferApplicationType {
  private _typeConstraints: TypeConstraints

  constructor(typeConstraints: TypeConstraints) {
    this._typeConstraints = typeConstraints
  }

  perform = (valueType: Type, argumentTypes: CurriedType): Type => {
    if (valueType instanceof TypeVariable) {
      valueType.unify(
        argumentTypes.concat(new TypeVariable()),
        this._typeConstraints,
      )

      return new TypeVariable()
    }

    this.checkAppliedToNonCurriedType(valueType, argumentTypes)
    this.handleVoidParameterType(valueType)
    this.checkAppliedTooManyArguments(valueType, argumentTypes)

    return this.inferType(valueType, argumentTypes)
  }

  private inferType = (
    valueType: CurriedType,
    argumentTypes: CurriedType,
  ): Type => {
    const typeConstraints = new TypeConstraints()
    const inferParameterType = this.inferParameterTypeFactory(
      typeConstraints,
      valueType,
      argumentTypes,
    )
    const parameterTypes = valueType.parameters.reduce(inferParameterType, [])

    if (parameterTypes.length == 1)
      return parameterTypes[0]._reduce(typeConstraints)
    else return new CurriedType(parameterTypes)._reduce(typeConstraints)
  }

  private inferParameterTypeFactory = (
    typeConstraints: TypeConstraints,
    valueType: CurriedType,
    argumentTypes: CurriedType,
  ) => (parameterTypes: Type[], parameterType: Type, i: number): Type[] => {
    const argumentType = argumentTypes.parameters[i]
    if (argumentType === undefined || this.isPlaceholderArgument(argumentType))
      return parameterTypes.concat([parameterType])

    try {
      parameterType.unify(argumentType, typeConstraints)
    } catch (error) {
      if (error instanceof TypeError)
        this.handleArgumentTypeMismatch(error, valueType, argumentTypes)
      throw error
    }

    return parameterTypes
  }

  private handleArgumentTypeMismatch = (
    error: TypeError,
    valueType: CurriedType,
    argumentTypes: CurriedType,
  ): void =>
    error.addTypeMismatch(
      new CurriedType(valueType.parameters.slice(0, -1)),
      argumentTypes,
    )

  private handleVoidParameterType = (valueType: CurriedType): void => {
    if (!(valueType instanceof ParametricType && valueType.name === VOID_TYPE))
      return

    valueType.parameters.pop()
  }

  private checkAppliedToNonCurriedType(
    valueType: Type,
    argumentTypes: CurriedType,
  ): asserts valueType is CurriedType {
    if (valueType instanceof CurriedType) return

    throw new TypeError(
      valueType,
      argumentTypes,
      'Cannot apply to a non-curried type.',
    )
  }

  private checkAppliedTooManyArguments = (
    valueType: CurriedType,
    argumentTypes: CurriedType,
  ): void => {
    if (valueType.parameters.length > argumentTypes.parameters.length) return

    throw new TypeError(
      new CurriedType(valueType.parameters.slice(0, -1)),
      argumentTypes,
      `Applied ${argumentTypes.parameters.length} arguments to a curried ` +
        `type accepting at most ${valueType.parameters.length - 1} arguments.`,
    )
  }

  private isPlaceholderArgument = (argumentType: Type): boolean =>
    argumentType instanceof TypeVariable &&
    argumentType.name === INTERNAL_PARTIAL_APPLICATION_TYPE_NAME
}
