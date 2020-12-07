import * as AST from '../../ast'
import { Answer, Disjunction } from '../models'
import { BuildType, Type, TypeConstraint, TypeVariable } from '../../types/util'
import { DuplicateBindingError, assert } from '../../errors'
import {
  IdentifierBinding,
  IdentifierBindingTemplate,
  NestedScope,
} from '../../symbol_table'
import { InferTypes } from '../InferTypes'
import { SyntaxNode } from 'tree-sitter-tony'

type Factory<T> = (
  name: string,
  transformedName: string,
  def?: AST.Expression,
) => T
type TypeFactory = (type: Type) => Type
type TypeConstraintFactory = (
  type: TypeConstraint<Type>,
) => TypeConstraint<Type>

export class InferIdentifierPatternType<T extends AST.IdentifierPattern> {
  private _factory: Factory<T>
  private _inferTypes: InferTypes
  private _scope: NestedScope
  private _typeFactory: TypeFactory
  private _typeConstraintFactory: TypeConstraintFactory

  constructor(
    inferTypes: InferTypes,
    scope: NestedScope,
    factory: Factory<T>,
    typeFactory = (type: Type): Type => type,
    typeConstraintFactory = (
      type: TypeConstraint<Type>,
    ): TypeConstraint<Type> => type,
  ) {
    this._factory = factory
    this._inferTypes = inferTypes
    this._scope = scope
    this._typeFactory = typeFactory
    this._typeConstraintFactory = typeConstraintFactory
  }

  perform = (
    patternNode: SyntaxNode,
    typeConstraint: TypeConstraint<Type>,
  ): Disjunction<T> => {
    const bindingTemplate = this.findBindingTemplate(patternNode)
    // @ts-ignore
    const type = patternNode.typeNode
      ? // @ts-ignore
        new BuildType().perform(patternNode.typeNode)
      : new TypeVariable()

    const unifiedTypeConstraint = new TypeConstraint(
      this._typeFactory(type).unsafeUnify(
        typeConstraint.type,
        typeConstraint.typeEqualityGraph,
      ),
      typeConstraint.typeEqualityGraph,
    )

    // @ts-ignore
    const defaultNode: SyntaxNode | undefined = patternNode.defaultNode
    if (defaultNode)
      return this.handleDefaultNode(
        bindingTemplate,
        unifiedTypeConstraint,
        this._inferTypes.traverse(defaultNode),
      )

    if (
      !this.buildIdentifierBinding(
        bindingTemplate,
        this._typeConstraintFactory(unifiedTypeConstraint),
      )
    )
      return new Disjunction([])

    return new Disjunction([
      new Answer(
        this._factory(bindingTemplate.name, bindingTemplate.transformedName),
        unifiedTypeConstraint,
      ),
    ])
  }

  private findBindingTemplate = (
    patternNode: SyntaxNode,
  ): IdentifierBindingTemplate => {
    const bindingTemplate = this._scope.bindingTemplates.find(
      (bindingTemplate) => bindingTemplate.node === patternNode,
    )

    assert(
      bindingTemplate instanceof IdentifierBindingTemplate,
      'Pattern identifier binding should be found in current scope.',
    )

    return bindingTemplate
  }

  private handleDefaultNode = (
    bindingTemplate: IdentifierBindingTemplate,
    typeConstraint: TypeConstraint<Type>,
    def: Disjunction<AST.Expression>,
  ): Disjunction<T> =>
    new Disjunction(
      def.answers.map((answer) => {
        const unifiedTypeConstraint = typeConstraint.unify(
          new TypeConstraint(
            this._typeFactory(answer.typeConstraint.type),
            answer.typeConstraint.typeEqualityGraph,
          ),
        )
        if (unifiedTypeConstraint === undefined) return

        if (
          !this.buildIdentifierBinding(
            bindingTemplate,
            this._typeConstraintFactory(unifiedTypeConstraint),
          )
        )
          return

        return new Answer(
          this._factory(
            bindingTemplate.name,
            bindingTemplate.transformedName,
            answer.node,
          ),
          unifiedTypeConstraint,
        )
      }),
    )

  private buildIdentifierBinding = (
    bindingTemplate: IdentifierBindingTemplate,
    typeConstraint: TypeConstraint<Type>,
  ): boolean => {
    this.checkDuplicateBinding(bindingTemplate, typeConstraint)

    const binding = this.findBindingForTemplate(bindingTemplate)
    if (binding) {
      const unifiedTypeConstraint = binding.typeConstraint.unify(typeConstraint)
      if (unifiedTypeConstraint === undefined) return false

      this._scope.removeBinding(binding)
      return this.addBinding(bindingTemplate, unifiedTypeConstraint)
    }

    return this.addBinding(bindingTemplate, typeConstraint)
  }

  private checkDuplicateBinding = (
    bindingTemplate: IdentifierBindingTemplate,
    typeConstraint: TypeConstraint<Type>,
  ): void => {
    const duplicateBinding = this._scope
      .resolveBindings(bindingTemplate.name)
      .find(
        (binding) =>
          binding instanceof IdentifierBinding &&
          binding.node !== bindingTemplate.node &&
          typeConstraint.unify(binding.typeConstraint),
      )
    if (duplicateBinding === undefined) return

    throw new DuplicateBindingError(bindingTemplate.name)
  }

  private findBindingForTemplate = (
    bindingTemplate: IdentifierBindingTemplate,
  ): IdentifierBinding | undefined => {
    const binding = this._scope
      .resolveBindings(bindingTemplate.name)
      .find(
        (binding) =>
          binding.node === bindingTemplate.node &&
          binding instanceof IdentifierBinding,
      )
    if (binding === undefined) return

    assert(
      binding instanceof IdentifierBinding,
      'Should be identifier binding.',
    )
    return binding
  }

  private addBinding = (
    bindingTemplate: IdentifierBindingTemplate,
    typeConstraint: TypeConstraint<Type>,
  ): boolean => {
    const binding = bindingTemplate.buildBinding(typeConstraint)
    if (binding === undefined) return false

    this._scope.addBinding(binding)
    return true
  }
}
