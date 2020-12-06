import * as AST from '../../ast'
import { Answer, Disjunction } from '../models'
import {
  Binding,
  BindingTemplate,
  IdentifierBinding,
  IdentifierBindingTemplate,
} from '../../symbol_table'
import { InternalError, InvalidModuleAccessError, assert } from '../../errors'
import {
  LIST_TYPE,
  MAP_TYPE,
  NUMBER_TYPE,
  ParametricType,
  STRING_TYPE,
  TUPLE_TYPE,
  Type,
  TypeConstraint,
  TypeEqualityGraph,
  TypeVariable,
} from '../../types'
import { GetModuleTypeRepresentation } from './GetModuleTypeRepresentation'
import { MergeTypeDisjunction } from './MergeTypeDisjunction'

export class InferAccessType {
  private _getModuleTypeRepresentation: GetModuleTypeRepresentation

  constructor(getModuleTypeRepresentation: GetModuleTypeRepresentation) {
    this._getModuleTypeRepresentation = getModuleTypeRepresentation
  }

  perform = (
    value: Disjunction<AST.Expression>,
    accessor: Disjunction<AST.Expression>,
  ): Disjunction<AST.Access> =>
    new MergeTypeDisjunction<AST.Expression, AST.Expression, AST.Access>(
      this.buildAnswers,
    ).perform(value, accessor)

  private buildAnswers = (
    value: Answer<AST.Expression>,
    accessor: Answer<AST.Expression>,
  ): Disjunction<AST.Access> | undefined => {
    const typeEqualityGraph = TypeEqualityGraph.build(
      value.typeConstraint.typeEqualityGraph,
      accessor.typeConstraint.typeEqualityGraph,
    )
    if (typeEqualityGraph === undefined) return

    return this.inferType(value, accessor, typeEqualityGraph)
  }

  // eslint-disable-next-line max-lines-per-function
  private inferType = (
    value: Answer<AST.Expression>,
    accessor: Answer<AST.Expression>,
    typeEqualityGraph: TypeEqualityGraph,
  ): Disjunction<AST.Access> | undefined => {
    const valueType = value.typeConstraint.type
    const accessorType = accessor.typeConstraint.type

    return new Disjunction([
      this.buildAnswer(
        value,
        accessor,
        this.inferListAccessType(valueType, accessorType, typeEqualityGraph),
        typeEqualityGraph,
      ),
      this.buildAnswer(
        value,
        accessor,
        this.inferMapAccessType(valueType, accessorType, typeEqualityGraph),
        typeEqualityGraph,
      ),
      this.buildAnswer(
        value,
        accessor,
        this.inferTupleAccessType(
          valueType,
          accessorType,
          accessor.node,
          typeEqualityGraph,
        ),
        typeEqualityGraph,
      ),
      ...this.inferModuleAccessType(
        valueType,
        value.node,
        accessorType,
        accessor.node,
        typeEqualityGraph,
      ),
    ])
  }

  private buildAnswer = (
    value: Answer<AST.Expression>,
    accessor: Answer<AST.Expression>,
    type: Type | undefined,
    typeEqualityGraph: TypeEqualityGraph,
  ): Answer<AST.Access> | undefined =>
    Answer.build(
      new AST.Access(value.node, accessor.node),
      TypeConstraint.build(type, typeEqualityGraph),
    )

  private inferListAccessType = (
    valueType: Type,
    accessorType: Type,
    typeEqualityGraph: TypeEqualityGraph,
  ): Type | undefined => {
    const unifiedValueType = new ParametricType(LIST_TYPE, [
      new TypeVariable(),
    ]).unify(valueType, typeEqualityGraph)
    if (unifiedValueType === undefined) return
    const unifiedAccessorType = new ParametricType(NUMBER_TYPE).unify(
      accessorType,
      typeEqualityGraph,
    )
    if (unifiedAccessorType === undefined) return

    assert(
      unifiedValueType instanceof ParametricType,
      'Should be parametric type.',
    )
    return unifiedValueType.parameters[0]
  }

  private inferMapAccessType = (
    valueType: Type,
    accessorType: Type,
    typeEqualityGraph: TypeEqualityGraph,
  ): Type | undefined => {
    const unifiedValueType = new ParametricType(MAP_TYPE, [
      new TypeVariable(),
      new TypeVariable(),
    ]).unify(valueType, typeEqualityGraph)
    if (unifiedValueType === undefined) return

    assert(
      unifiedValueType instanceof ParametricType,
      'Should be parametric type.',
    )
    const unifiedAccessorType = unifiedValueType.parameters[0].unify(
      accessorType,
      typeEqualityGraph,
    )
    if (unifiedAccessorType === undefined) return

    return unifiedValueType.parameters[1]
  }

  private inferTupleAccessType = (
    valueType: Type,
    accessorType: Type,
    accessorNode: AST.Expression,
    typeEqualityGraph: TypeEqualityGraph,
  ): Type | undefined => {
    if (!(valueType instanceof ParametricType) || valueType.name !== TUPLE_TYPE)
      return
    const unifiedAccessorType = new ParametricType(NUMBER_TYPE).unify(
      accessorType,
      typeEqualityGraph,
    )
    if (unifiedAccessorType === undefined) return

    // TODO: implement dynamic access with union types
    if (accessorNode instanceof AST.Number)
      return valueType.parameters[accessorNode.value]
    else
      throw new InternalError(
        'Dynamic tuple access has not been implemented yet.',
      )
  }

  // eslint-disable-next-line max-lines-per-function
  private inferModuleAccessType = (
    valueType: Type,
    valueNode: AST.Expression,
    accessorType: Type,
    accessorNode: AST.Expression,
    typeEqualityGraph: TypeEqualityGraph,
  ): Answer<AST.Access>[] => {
    if (!(valueType instanceof ParametricType)) return []
    const unifiedAccessorType = new ParametricType(STRING_TYPE).unify(
      accessorType,
      typeEqualityGraph,
    )
    if (unifiedAccessorType === undefined) return []

    const moduleType = this._getModuleTypeRepresentation.perform(valueType)

    if (accessorNode instanceof AST.ShorthandAccessIdentifier) {
      const bindings = moduleType.resolveProperty(accessorNode.name)

      if (bindings.length > 0)
        return this.inferModuleBindingType(
          valueNode,
          bindings,
          typeEqualityGraph,
        )
      else
        throw new InvalidModuleAccessError(
          accessorNode.name,
          moduleType.toString(),
        )
    } else throw new InvalidModuleAccessError(moduleType.toString())
  }

  private inferModuleBindingType = (
    valueNode: AST.Expression,
    bindings: (Binding | BindingTemplate)[],
    typeEqualityGraph: TypeEqualityGraph,
  ): Answer<AST.Access>[] =>
    bindings.reduce((answers: Answer<AST.Access>[], binding) => {
      assert(
        binding instanceof IdentifierBinding ||
          binding instanceof IdentifierBindingTemplate,
        'Binding should be an identifier binding.',
      )

      return [
        ...answers,
        this.buildModuleAccessAnswer(valueNode, binding, typeEqualityGraph),
      ]
    }, [])

  private buildModuleAccessAnswer = (
    valueNode: AST.Expression,
    binding: IdentifierBinding | IdentifierBindingTemplate,
    typeEqualityGraph: TypeEqualityGraph,
  ): Answer<AST.Access> =>
    new Answer(
      new AST.Access(
        valueNode,
        new AST.ShorthandAccessIdentifier(
          binding.name,
          binding.transformedName,
        ),
      ),
      new TypeConstraint(
        binding.typeConstraint.type,
        TypeEqualityGraph.build(
          typeEqualityGraph,
          binding.typeConstraint.typeEqualityGraph,
        ),
      ),
    )
}
