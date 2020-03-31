import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

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
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (valueType: Type, argumentTypes: CurriedType): Type => {
    const inferredValueType = this.inferValueType(valueType, argumentTypes)

    this.handleVoidParameterType(inferredValueType)
    this.checkAppliedTooManyArguments(
      inferredValueType,
      argumentTypes.parameters.length
    )

    return this.inferType(inferredValueType, argumentTypes)
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

        this.checkArgumentTypeMismatch(
          parameterType,
          argumentType,
          typeConstraints
        )
        return parameterTypes
      }, [])

    if (parameterTypes.length == 1)
      return parameterTypes[0].applyConstraints(typeConstraints)
    else
      return new CurriedType(parameterTypes).applyConstraints(typeConstraints)
  }

  private handleVoidParameterType = (valueType: CurriedType): void => {
    if (!(valueType instanceof ParametricType &&
          valueType.name === VOID_TYPE)) return

    valueType.parameters.pop()
  }

  private inferValueType(
    valueType: Type,
    argumentTypes: CurriedType
  ): CurriedType {
    if (valueType instanceof CurriedType) return valueType
    if (valueType instanceof TypeVariable)
      return argumentTypes.concat(new TypeVariable)

    this.errorHandler.throw(
      `Cannot apply to the non-curried type '${valueType.toString()}'.`,
      this.node
    )
  }

  private checkAppliedTooManyArguments = (
    valueType: CurriedType,
    argumentTypeCount: number
  ): void => {
    if (valueType.parameters.length > argumentTypeCount) return

    this.errorHandler.throw(
      `Applied ${argumentTypeCount} arguments to type ` +
      `'${valueType.toString()}' accepting at most ` +
      `${valueType.parameters.length - 1} arguments.`,
      this.node
    )
  }

  private checkArgumentTypeMismatch = (
    parameterType: Type,
    argumentType: Type,
    typeConstraints: TypeConstraints
  ): void => {
    try {
      parameterType.unify(argumentType, typeConstraints)
    } catch (error) {
      this.errorHandler.throw(
        `Argument of type '${argumentType.toString()}' not assignable to ` +
        `type '${parameterType.toString()}'.\n\n${error.message}`,
        this.node
      )
    }
  }

  private isPlaceholderArgument = (argumentType: Type): boolean =>
    argumentType instanceof TypeVariable &&
    argumentType.name === INTERNAL_PARTIAL_APPLICATION_TYPE_NAME
}
