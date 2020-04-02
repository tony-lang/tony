import Parser from 'tree-sitter'

import {
  assert,
  InternalError,
  MissingBindingError,
  TypeError
} from '../../errors'

import {
  ParametricType,
  Type,
  TypeConstraints,
  NUMBER_TYPE,
  STRING_TYPE,
  LIST_TYPE,
  MAP_TYPE,
  TUPLE_TYPE
} from '../types'
import { BuildSymbolTable, TypeBinding } from '../symbol_table'

export class InferAccessType {
  private buildSymbolTable: BuildSymbolTable
  private node: Parser.SyntaxNode
  private typeConstraints: TypeConstraints

  constructor(
    node: Parser.SyntaxNode,
    buildSymbolTable: BuildSymbolTable,
    typeConstraints: TypeConstraints
  ) {
    this.node = node
    this.buildSymbolTable = buildSymbolTable
    this.typeConstraints = typeConstraints
  }

  perform = (valueType: Type, accessorType: Type): Type => {
    if (valueType instanceof ParametricType) {
      if (valueType.name === LIST_TYPE)
        return this.accessList(valueType, accessorType)
      else if (valueType.name === TUPLE_TYPE)
        return this.accessTuple(valueType, accessorType)
      else if (valueType.name === MAP_TYPE)
        return this.accessMap(valueType, accessorType)
      else
        return this.accessRepresentation(valueType, accessorType)
    }

    throw new TypeError(
      valueType,
      undefined,
      'The access operator may only be used on objects or values of a list, ' +
      'tuple or map type.'
    )
  }

  private accessList = (
    valueType: ParametricType,
    accessorType: Type
  ): Type => {
    new ParametricType(NUMBER_TYPE).unify(accessorType, this.typeConstraints)

    return valueType.parameters[0]
  }

  private accessMap = (valueType: ParametricType, accessorType: Type): Type => {
    valueType.parameters[0].unify(accessorType, this.typeConstraints)

    return valueType.parameters[1]
  }

  private accessTuple = (
    valueType: ParametricType,
    accessorType: Type
  ): Type => {
    new ParametricType(NUMBER_TYPE).unify(accessorType, this.typeConstraints)

    // TODO: implement dynamic access with union types
    if (this.node.namedChild(1).type === 'shorthand_access_identifier') {
      const shorthandAccessIdentifier = this.node.namedChild(1)
      const index = parseInt(shorthandAccessIdentifier.text)

      return valueType.parameters[index]
    } else throw new InternalError(
      'Dynamic tuple access has not been implemented yet.'
    )
  }

  private accessRepresentation = (
    valueType: ParametricType,
    accessorType: Type
  ): Type => {
    new ParametricType(STRING_TYPE).unify(accessorType, this.typeConstraints)

    // TODO: implement dynamic access with union types
    if (this.node.namedChild(1).type === 'shorthand_access_identifier') {
      const shorthandAccessIdentifier = this.node.namedChild(1)
      const propertyName = shorthandAccessIdentifier.text

      const binding = this.buildSymbolTable.resolveBinding(valueType.name)
      assert(binding instanceof TypeBinding, 'Should be a type binding.')
      assert(
        binding.representation,
        `Object representation of ${valueType.toString()} should be present.`
      )

      const property = binding.representation.findProperty(propertyName)
      if (property) return property.type
      else throw new MissingBindingError(
        propertyName, binding.type.toString(), binding.representation.toString()
      )
    } else throw new InternalError(
      'Dynamic object access has not been implemented yet.'
    )
  }
}
