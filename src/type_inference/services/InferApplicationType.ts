import * as AST from '../../ast'
import {
  AccumulatedAnswer,
  AccumulatedDisjunction,
  Answer,
  Disjunction,
} from '../models'
import {
  FUNCTION_TYPE,
  ParametricType,
  Type,
  TypeConstraint,
  TypeEqualityGraph,
  TypeVariable,
  VOID_TYPE,
} from '../../types'
import { InternalTypeError, TypeError } from '../../errors'

type Factory<T, U, V> = (
  valueNode: T,
  argumentNodes: U[],
  typeConstraint: TypeConstraint<Type>,
) => Answer<V>

export class InferApplicationType<
  T extends AST.SyntaxNode,
  U extends AST.SyntaxNode,
  V extends AST.SyntaxNode
> {
  private _factory: Factory<T, U, V>

  constructor(factory: Factory<T, U, V>) {
    this._factory = factory
  }

  perform = (
    value: Disjunction<T>,
    args: AccumulatedDisjunction<U>,
  ): Disjunction<V> =>
    new Disjunction(
      value.answers.reduce(
        (answers: (Answer<V> | undefined)[], valueAnswer) => [
          ...answers,
          ...args.map((argumentsAnswer) =>
            this.buildAnswers(valueAnswer, argumentsAnswer),
          ),
        ],
        [],
      ),
    )

  private buildAnswers = (
    valueAnswer: Answer<T>,
    argumentsAnswer: AccumulatedAnswer<U>,
  ): Answer<V> | undefined => {
    const typeConstraint = this.inferType(valueAnswer, argumentsAnswer)
    if (typeConstraint === undefined) return

    return this._factory(
      valueAnswer.node,
      argumentsAnswer.nodes,
      typeConstraint,
    )
  }

  // eslint-disable-next-line max-lines-per-function
  private inferType = (
    value: Answer<T>,
    args: AccumulatedAnswer<U>,
  ): TypeConstraint<Type> | undefined => {
    let valueTypeConstraint = value.typeConstraint
    const argumentsTypeEqualityGraph = TypeEqualityGraph.build(
      ...args.typeConstraints.map(
        (typeConstraint) => typeConstraint.typeEqualityGraph,
      ),
    )
    if (argumentsTypeEqualityGraph === undefined) return

    const argumentsTypeConstraint = new TypeConstraint(
      new ParametricType(
        FUNCTION_TYPE,
        args.typeConstraints.map((typeConstraint) => typeConstraint.type),
      ),
      argumentsTypeEqualityGraph,
    )
    console.log(
      valueTypeConstraint.toString(),
      argumentsTypeConstraint.toString(),
    )

    if (valueTypeConstraint.type instanceof TypeVariable)
      return this.inferValueType(value, argumentsTypeConstraint)

    if (
      !this.checkAppliedToNonCurriedType(
        valueTypeConstraint.type,
        argumentsTypeConstraint.type,
      )
    )
      return
    valueTypeConstraint = this.handleVoidParameterType(
      valueTypeConstraint as TypeConstraint<ParametricType>,
    )
    if (
      !this.checkAppliedTooManyArguments(
        valueTypeConstraint.type as ParametricType,
        argumentsTypeConstraint.type,
      )
    )
      return

    return this.matchArgumentsAndParameters(
      valueTypeConstraint as TypeConstraint<ParametricType>,
      argumentsTypeConstraint,
    )
  }

  private inferValueType = (
    value: Answer<T>,
    argumentsType: TypeConstraint<ParametricType>,
  ): TypeConstraint<Type> | undefined => {
    const returnType = new TypeVariable()
    const functionType = new TypeConstraint(
      argumentsType.type.concat(returnType),
      argumentsType.typeEqualityGraph,
    )
    const applicationTypeConstraint = value.typeConstraint.unify(functionType)
    if (applicationTypeConstraint === undefined) return

    return new TypeConstraint(
      returnType,
      applicationTypeConstraint.typeEqualityGraph,
    )
  }

  private checkAppliedToNonCurriedType(
    valueType: Type,
    argumentsType: ParametricType,
  ): valueType is ParametricType {
    if (valueType instanceof ParametricType && valueType.name === FUNCTION_TYPE)
      return true

    TypeError.addError(
      new InternalTypeError(
        valueType,
        argumentsType,
        'Cannot apply to a non-curried type.',
      ),
    )
    return false
  }

  private handleVoidParameterType = (
    valueTypeConstraint: TypeConstraint<ParametricType>,
  ): TypeConstraint<ParametricType> => {
    const firstParameter = valueTypeConstraint.type.parameters[0]
    if (
      !(
        firstParameter instanceof ParametricType &&
        firstParameter.name === VOID_TYPE
      )
    )
      return valueTypeConstraint

    return new TypeConstraint(
      new ParametricType(
        FUNCTION_TYPE,
        valueTypeConstraint.type.parameters.slice(1),
      ),
      valueTypeConstraint.typeEqualityGraph,
    )
  }

  private checkAppliedTooManyArguments = (
    valueType: ParametricType,
    argumentsType: ParametricType,
  ): boolean => {
    if (valueType.parameters.length > argumentsType.parameters.length)
      return true

    TypeError.addError(
      new InternalTypeError(
        new ParametricType(FUNCTION_TYPE, valueType.parameters.slice(0, -1)),
        argumentsType,
        `Applied ${argumentsType.parameters.length} arguments to a curried ` +
          `type accepting at most ${
            valueType.parameters.length - 1
          } arguments.`,
      ),
    )
    return false
  }

  // eslint-disable-next-line max-lines-per-function
  private matchArgumentsAndParameters = (
    valueTypeConstraint: TypeConstraint<ParametricType>,
    argumentsTypeConstraint: TypeConstraint<ParametricType>,
  ): TypeConstraint<Type> | undefined => {
    const typeEqualityGraph = TypeEqualityGraph.build(
      valueTypeConstraint.typeEqualityGraph,
      argumentsTypeConstraint.typeEqualityGraph,
    )
    const returnTypeEqualityGraph = TypeEqualityGraph.build(
      valueTypeConstraint.typeEqualityGraph,
      argumentsTypeConstraint.typeEqualityGraph,
    )
    if (
      typeEqualityGraph === undefined ||
      returnTypeEqualityGraph === undefined
    )
      return

    const parameterTypes = valueTypeConstraint.type.parameters.reduce(
      this.inferParameterType(typeEqualityGraph, argumentsTypeConstraint.type),
      [],
    )
    if (parameterTypes === undefined) return

    return this.buildReturnTypeConstraint(
      parameterTypes,
      returnTypeEqualityGraph,
    )
  }

  private inferParameterType = (
    typeEqualityGraph: TypeEqualityGraph,
    argumentTypes: ParametricType,
  ) => (
    parameterTypes: Type[] | undefined,
    parameterType: Type,
    i: number,
  ): Type[] | undefined => {
    if (parameterTypes === undefined) return

    const argumentType = argumentTypes.parameters[i]
    if (argumentType === undefined || this.isPlaceholderArgument(argumentType))
      return [...parameterTypes, parameterType]
    if (parameterType.unify(argumentType, typeEqualityGraph) === undefined)
      return

    return parameterTypes
  }

  private buildReturnTypeConstraint = (
    parameterTypes: Type[],
    typeEqualityGraph: TypeEqualityGraph,
  ): TypeConstraint<Type> =>
    new TypeConstraint(
      parameterTypes.length == 1
        ? parameterTypes[0].reduce(typeEqualityGraph)
        : new ParametricType(FUNCTION_TYPE, parameterTypes).reduce(
            typeEqualityGraph,
          ),
      typeEqualityGraph,
    )

  private isPlaceholderArgument = (argumentType: Type): boolean =>
    argumentType instanceof ParametricType && argumentType.name === VOID_TYPE
}
