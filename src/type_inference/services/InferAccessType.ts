import {
  InternalError,
  InvalidPropertyAccessError,
  TypeError,
  assert,
} from '../../errors'
import {
  LIST_TYPE,
  MAP_TYPE,
  NUMBER_TYPE,
  ParametricType,
  STRING_TYPE,
  TUPLE_TYPE,
  Type,
  TypeConstraints,
} from '../../types'
import { NestedScope, TypeBinding } from '../../symbol_table'
import Parser from 'tree-sitter'

export class InferAccessType {
  private _node: Parser.SyntaxNode
  private _scope: NestedScope
  private _typeConstraints: TypeConstraints

  constructor(
    node: Parser.SyntaxNode,
    scope: NestedScope,
    typeConstraints: TypeConstraints,
  ) {
    this._node = node
    this._scope = scope
    this._typeConstraints = typeConstraints
  }

  perform = (valueType: Type, accessorType: Type): Type => {
    if (valueType instanceof ParametricType) {
      if (valueType.name === LIST_TYPE)
        return this.accessList(valueType, accessorType)
      else if (valueType.name === TUPLE_TYPE)
        return this.accessTuple(valueType, accessorType)
      else if (valueType.name === MAP_TYPE)
        return this.accessMap(valueType, accessorType)
      else return this.accessRepresentation(valueType, accessorType)
    }

    throw new TypeError(
      valueType,
      undefined,
      'The access operator may only be used on objects or values of a list, ' +
        'tuple or map type.',
    )
  }

  private accessList = (
    valueType: ParametricType,
    accessorType: Type,
  ): Type => {
    new ParametricType(NUMBER_TYPE).unify(accessorType, this._typeConstraints)

    return valueType.parameters[0]
  }

  private accessMap = (valueType: ParametricType, accessorType: Type): Type => {
    valueType.parameters[0].unify(accessorType, this._typeConstraints)

    return valueType.parameters[1]
  }

  private accessTuple = (
    valueType: ParametricType,
    accessorType: Type,
  ): Type => {
    new ParametricType(NUMBER_TYPE).unify(accessorType, this._typeConstraints)

    // TODO: implement dynamic access with union types
    if (this._node.namedChild(1)!.type === 'number') {
      const numberNode = this._node.namedChild(1)!
      const index = parseInt(numberNode.text)

      return valueType.parameters[index]
    } else
      throw new InternalError(
        'Dynamic tuple access has not been implemented yet.',
      )
  }

  private accessRepresentation = (
    valueType: ParametricType,
    accessorType: Type,
  ): Type => {
    new ParametricType(STRING_TYPE).unify(accessorType, this._typeConstraints)

    // TODO: implement dynamic access with union types
    if (this._node.namedChild(1)!.type === 'shorthand_access_identifier') {
      const propertyName = this._node.namedChild(1)!.text

      const binding = this._scope.resolveBinding(valueType.name)
      assert(binding instanceof TypeBinding, 'Should be a type binding.')

      return this.accessRepresentationProperty(binding, propertyName)
    } else
      throw new InternalError(
        'Dynamic object access has not been implemented yet.',
      )
  }

  private accessRepresentationProperty = (
    binding: TypeBinding,
    propertyName: string,
  ): Type => {
    const property = binding.representation.findProperty(propertyName)

    if (property) return property.type
    else
      throw new InvalidPropertyAccessError(
        propertyName,
        binding.type.toString(),
        binding.representation.toString(),
      )
  }
}
