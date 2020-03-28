import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import {
  CurriedTypeConstructor,
  ListType,
  SingleTypeConstructor,
  Type,
  TypeConstructor,
  PLACEHOLDER_TYPE,
  VOID_TYPE
} from '../types'

export class InferApplicationType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (
    valueType: TypeConstructor,
    argumentTypes: CurriedTypeConstructor
  ): TypeConstructor => {
    this.checkApplicationToNonCurriedType(valueType)
    this.handleVoidParameterType(valueType)
    this.checkAppliedTooManyArguments(valueType, argumentTypes.length)

    return this.inferType(valueType, argumentTypes)
  }

  private inferType = (
    valueType: CurriedTypeConstructor,
    argumentTypes: CurriedTypeConstructor
  ): TypeConstructor => {
    const appliedParameterIndices: number[] = []
    const parameterTypes = valueType.types.slice(0, -1)

    for (
      let parameterIndex = 0;
      parameterIndex < parameterTypes.length;
      parameterIndex++
    ) {
      const parameterType = parameterTypes[parameterIndex]
      const argumentType = argumentTypes.types[parameterIndex]

      if (this.isPlaceholderArgument(argumentType)) continue

      if (parameterType instanceof SingleTypeConstructor &&
          parameterType.type instanceof ListType &&
          parameterType.type.isRest) {
        // no argument applied to rest parameter
        if (argumentType === undefined) continue

        this.checkArgumentTypeMismatch(parameterType.type.type, argumentType)

        if (parameterIndex < argumentTypes.length - 1)
          parameterTypes.splice(parameterIndex, 0, parameterType)

        continue
      }

      this.checkArgumentTypeMismatch(parameterType, argumentType)

      appliedParameterIndices.push(parameterIndex)
    }

    return valueType.apply(appliedParameterIndices)
  }

  private handleVoidParameterType = (
    valueType: CurriedTypeConstructor
  ): void => {
    if (!(valueType instanceof SingleTypeConstructor && valueType.type instanceof Type && valueType.type.name === VOID_TYPE)) return

    valueType.types.pop()
  }

  private checkApplicationToNonCurriedType(
    valueType: TypeConstructor
  ): asserts valueType is CurriedTypeConstructor {
    if (valueType instanceof CurriedTypeConstructor) return

    this.errorHandler.throw(
      `Cannot apply to the non-curried type '${valueType.toString()}'`,
      this.node
    )
  }

  private checkAppliedTooManyArguments = (
    valueType: CurriedTypeConstructor,
    argumentTypeCount: number
  ): void => {
    if (valueType.length > argumentTypeCount) return

    const lastParameterType = valueType.types[valueType.length - 2]
    if (lastParameterType instanceof SingleTypeConstructor &&
        lastParameterType.type instanceof ListType &&
        lastParameterType.type.isRest) return

    this.errorHandler.throw(
      `Expected at most ${valueType.length - 1} arguments, but applied ` +
      `${argumentTypeCount} arguments`,
      this.node
    )
  }

  private checkArgumentTypeMismatch = (
    parameterType: TypeConstructor,
    argumentType: TypeConstructor
  ): void => {
    if (parameterType.matches(argumentType)) return

    this.errorHandler.throw(
      `Expected argument of type '${parameterType.toString()}', but got ` +
      `'${argumentType.toString()}'`,
      this.node
    )
  }

  private isPlaceholderArgument = (argumentType: TypeConstructor): boolean =>
    argumentType.toString() === PLACEHOLDER_TYPE
}
