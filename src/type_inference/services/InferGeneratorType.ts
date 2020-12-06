import * as AST from '../../ast'
import { Answer, Disjunction } from '../models'
import {
  BOOLEAN_TYPE,
  LIST_TYPE,
  ParametricType,
  Type,
  TypeConstraint,
  TypeEqualityGraph,
  VOID_TYPE,
} from '../../types'
import { IdentifierBindingTemplate, NestedScope } from '../../symbol_table'

export class InferGeneratorType<T> {
  private _scope: NestedScope

  constructor(scope: NestedScope) {
    this._scope = scope
  }

  perform = (
    bindingTemplate: IdentifierBindingTemplate,
    value: Disjunction<AST.SyntaxNode>,
    condition?: Disjunction<AST.SyntaxNode>,
  ): Disjunction<AST.Generator> =>
    new Disjunction(
      value.answers.reduce(
        this.handleValueAnswer(bindingTemplate, condition),
        [],
      ),
    )

  // eslint-disable-next-line max-lines-per-function
  private handleValueAnswer = (
    bindingTemplate: IdentifierBindingTemplate,
    condition: Disjunction<AST.SyntaxNode> | undefined,
    // eslint-disable-next-line max-lines-per-function
  ) => (
    answers: (Answer<AST.Generator> | undefined)[],
    valueAnswer: Answer<AST.SyntaxNode>,
  ): (Answer<AST.Generator> | undefined)[] => {
    const valueTypeConstraint = this.unifyValueTypeConstraint(
      bindingTemplate,
      valueAnswer,
    )
    if (valueTypeConstraint === undefined) return answers

    if (condition) {
      return [
        ...answers,
        ...this.buildAnswersWithCondition(
          bindingTemplate,
          valueTypeConstraint,
          valueAnswer,
          condition,
        ),
      ]
    } else
      return [
        ...answers,
        this.buildAnswer(bindingTemplate, valueTypeConstraint, valueAnswer),
      ]
  }

  private unifyValueTypeConstraint = (
    bindingTemplate: IdentifierBindingTemplate,
    value: Answer<AST.SyntaxNode>,
  ): TypeConstraint<Type> | undefined => {
    const unifiedTypeConstraint = new TypeConstraint(
      new ParametricType(LIST_TYPE, [bindingTemplate.type]),
    ).unify(value.typeConstraint) as TypeConstraint<ParametricType>
    if (unifiedTypeConstraint === undefined) return unifiedTypeConstraint

    const binding = bindingTemplate.buildBinding(
      new TypeConstraint(
        unifiedTypeConstraint.type.parameters[0],
        unifiedTypeConstraint.typeEqualityGraph,
      ),
    )
    if (binding === undefined) return

    this._scope.addBinding(binding)
    return unifiedTypeConstraint
  }

  private buildAnswer = (
    bindingTemplate: IdentifierBindingTemplate,
    typeConstraint: TypeConstraint<Type>,
    value: Answer<AST.SyntaxNode>,
  ): Answer<AST.Generator> =>
    new Answer(
      new AST.Generator(
        bindingTemplate.name,
        bindingTemplate.transformedName,
        value.node,
      ),
      new TypeConstraint(
        new ParametricType(VOID_TYPE),
        typeConstraint.typeEqualityGraph,
      ),
    )

  private buildAnswersWithCondition = (
    bindingTemplate: IdentifierBindingTemplate,
    valueTypeConstraint: TypeConstraint<Type>,
    valueAnswer: Answer<AST.SyntaxNode>,
    condition: Disjunction<AST.SyntaxNode>,
  ): (Answer<AST.Generator> | undefined)[] =>
    condition.answers.map(
      this.handleConditionAnswer(
        bindingTemplate,
        valueTypeConstraint,
        valueAnswer,
      ),
    )

  // eslint-disable-next-line max-lines-per-function
  private handleConditionAnswer = (
    bindingTemplate: IdentifierBindingTemplate,
    valueTypeConstraint: TypeConstraint<Type>,
    value: Answer<AST.SyntaxNode>,
    // eslint-disable-next-line max-lines-per-function
  ) => (
    condition: Answer<AST.SyntaxNode>,
  ): Answer<AST.Generator> | undefined => {
    const conditionTypeConstraint = this.unifyConditionTypeConstraint(condition)
    if (conditionTypeConstraint === undefined) return

    return new Answer(
      new AST.Generator(
        bindingTemplate.name,
        bindingTemplate.transformedName,
        value.node,
        condition.node,
      ),
      new TypeConstraint(
        new ParametricType(VOID_TYPE),
        TypeEqualityGraph.build(
          valueTypeConstraint.typeEqualityGraph,
          conditionTypeConstraint.typeEqualityGraph,
        ),
      ),
    )
  }

  private unifyConditionTypeConstraint = (
    condition: Answer<AST.SyntaxNode>,
  ): TypeConstraint<Type> | undefined =>
    new TypeConstraint(new ParametricType(BOOLEAN_TYPE)).unify(
      condition.typeConstraint,
    )
}
