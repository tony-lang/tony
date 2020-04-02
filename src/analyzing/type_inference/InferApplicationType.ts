import { TypeError } from '../../errors'

import {
  CurriedType,
  ParametricType,
  Type,
  TypeConstraints,
  TypeVariable,
  INTERNAL_PARTIAL_APPLICATION_TYPE_NAME,
  VOID_TYPE
} from '../types'

export class InferApplicationType {
  private typeConstraints: TypeConstraints

  constructor(typeConstraints: TypeConstraints) {
    this.typeConstraints = typeConstraints
  }

  perform = (valueType: Type, argumentTypes: CurriedType): Type => {
    if (valueType instanceof TypeVariable) {
      valueType.unify(
        argumentTypes.concat(new TypeVariable),
        this.typeConstraints
      )

      return new TypeVariable
    }

    this.checkAppledToNonCurriedType(valueType, argumentTypes)
    this.handleVoidParameterType(valueType)
    this.checkAppliedTooManyArguments(valueType, argumentTypes)

    return this.inferType(valueType, argumentTypes)
  }

  private inferType = (
    valueType: CurriedType,
    argumentTypes: CurriedType
  ): Type => {
    const typeConstraints = new TypeConstraints
    const parameterTypes =
      valueType.parameters.reduce((parameterTypes, parameterType, i) => {
        const argumentType = argumentTypes.parameters[i]
        if (argumentType === undefined ||
            this.isPlaceholderArgument(argumentType))
          return parameterTypes.concat([parameterType])

        try {
          parameterType.unify(argumentType, typeConstraints)
        } catch (error) {
          if (error instanceof TypeError)
            error.addTypeMismatch(
              new CurriedType(valueType.parameters.slice(0, -1)),
              argumentTypes
            )
          throw error
        }

        return parameterTypes
      }, [])

    if (parameterTypes.length == 1)
      return parameterTypes[0]._reduce(typeConstraints)
    else
      return new CurriedType(parameterTypes)._reduce(typeConstraints)
  }

  private handleVoidParameterType = (valueType: CurriedType): void => {
    if (!(valueType instanceof ParametricType &&
          valueType.name === VOID_TYPE)) return

    valueType.parameters.pop()
  }

  private checkAppledToNonCurriedType(
    valueType: Type,
    argumentTypes: CurriedType
  ): asserts valueType is CurriedType {
    if (valueType instanceof CurriedType) return

    throw new TypeError(
      valueType, argumentTypes, 'Cannot apply to a non-curried type.'
    )
  }

  private checkAppliedTooManyArguments = (
    valueType: CurriedType,
    argumentTypes: CurriedType
  ): void => {
    if (valueType.parameters.length > argumentTypes.parameters.length) return

    throw new TypeError(
      new CurriedType(valueType.parameters.slice(0, -1)),
      argumentTypes,
      `Applied ${argumentTypes.parameters.length} arguments to a curried ` +
      `type accepting at most ${valueType.parameters.length - 1} arguments.`
    )
  }

  private isPlaceholderArgument = (argumentType: Type): boolean =>
    argumentType instanceof TypeVariable &&
    argumentType.name === INTERNAL_PARTIAL_APPLICATION_TYPE_NAME
}
