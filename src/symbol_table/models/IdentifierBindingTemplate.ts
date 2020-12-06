import { Type, TypeConstraint, TypeVariable } from '../../types'
import { BindingTemplate } from './BindingTemplate'
import { IdentifierBinding } from './IdentifierBinding'
import Parser from 'tree-sitter'

const INTERNAL_IDENTIFIER_PREFIX = Object.freeze('tony_internal_')

export class IdentifierBindingTemplate implements BindingTemplate {
  private static count = 0

  private _isExported: boolean
  private _isImplicit: boolean
  private _name: string
  private _node: Parser.SyntaxNode
  private _transformedName: string
  protected _type: TypeVariable

  // eslint-disable-next-line max-lines-per-function
  constructor(
    node: Parser.SyntaxNode,
    name: string,
    {
      isExported = false,
      isImplicit = false,
    }: {
      isExported?: boolean
      isImplicit?: boolean
    } = {
      isExported: false,
      isImplicit: false,
    },
  ) {
    this._isExported = isExported
    this._isImplicit = isImplicit
    this._name = name
    this._node = node
    this._type = new TypeVariable()

    this._transformedName = IdentifierBindingTemplate.getTransformedName()
  }

  get isExported(): boolean {
    return this._isExported
  }

  get isImplicit(): boolean {
    return this._isImplicit
  }

  get name(): string {
    return this._name
  }

  get node(): Parser.SyntaxNode {
    return this._node
  }

  get type(): TypeVariable {
    return this._type
  }

  get typeConstraint(): TypeConstraint<TypeVariable> {
    return new TypeConstraint(this._type)
  }

  get transformedName(): string {
    return this._transformedName
  }

  buildBinding = (
    typeConstraint: TypeConstraint<Type>,
  ): IdentifierBinding | undefined => {
    const unifiedTypeConstraint = new TypeConstraint(this.type).unify(
      typeConstraint,
    )
    if (unifiedTypeConstraint === undefined) return

    return new IdentifierBinding(
      this.node,
      this.name,
      this.transformedName,
      unifiedTypeConstraint,
      { isExported: this.isExported, isImplicit: this.isImplicit },
    )
  }

  static getTransformedName = (): string =>
    `${INTERNAL_IDENTIFIER_PREFIX}${(IdentifierBindingTemplate.count += 1)}`
}
