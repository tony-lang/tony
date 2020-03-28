import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'
import { assert } from '../../utilities'

import {
  ListType,
  MapType,
  ObjectType,
  SingleTypeConstructor,
  TupleType,
  Type,
  TypeConstructor,
  NUMBER_TYPE,
  STRING_TYPE
} from '../types'

export class InferAccessType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler) {
    this.node = node
    this.errorHandler = errorHandler
  }

  perform = (
    valueType: TypeConstructor,
    accessType: TypeConstructor
  ): TypeConstructor => {
    if (!(valueType instanceof SingleTypeConstructor))
      this.errorHandler.throw(
        'Access operator cannot be used on values of type ' +
        `'${valueType.toString()}'`,
        this.node
      )
    else if (!(accessType instanceof SingleTypeConstructor))
      this.errorHandler.throw(
        'Access operator cannot be used on values of type ' +
        `'${accessType.toString()}'`,
        this.node
      )
    else return this.access(valueType, accessType)
  }

  private access = (
    valueType: SingleTypeConstructor,
    accessType: SingleTypeConstructor
  ): TypeConstructor => {
    const atomicValueType = valueType.type

    if (atomicValueType instanceof ListType)
      return this.accessList(atomicValueType, accessType)
    else if (atomicValueType instanceof MapType)
      return this.accessMap(atomicValueType, accessType)
    else if (this.node.namedChild(1).type === 'shorthand_access_identifier')
      if (atomicValueType instanceof TupleType)
        return this.accessTuple(atomicValueType, accessType)
      else if (atomicValueType instanceof ObjectType)
        return this.accessObject(atomicValueType, accessType)
      else
        this.errorHandler.throw(
          'Access operator cannot be used on values of type ' +
          `'${atomicValueType.toString()}'`,
          this.node
        )
    else {
      assert(
        false,
        'NOT_IMPLEMENTED_YET: dynamic access to tuples and objects has to ' +
        'wait for union types'
      )
    }
  }

  private accessList = (
    listType: ListType,
    accessType: SingleTypeConstructor
  ): TypeConstructor => {
    if (accessType instanceof SingleTypeConstructor && accessType.type instanceof Type && accessType.type.name === NUMBER_TYPE) return listType.type
    else
      this.errorHandler.throw(
        'Contents of list can only be accessed by an accessor of type ' +
        `'Number', but got '${accessType.toString()}'`,
        this.node
      )
  }

  private accessMap = (
    mapType: MapType,
    accessType: SingleTypeConstructor
  ): TypeConstructor => {
    if (accessType.matches(mapType.keyType)) return mapType.valueType
    else
      this.errorHandler.throw(
        `Expected key type '${mapType.keyType}', but got ` +
        `'${accessType.toString()}'`,
        this.node
      )
  }

  private accessTuple = (
    tupleType: TupleType,
    accessType: SingleTypeConstructor
  ): TypeConstructor => {
    const index = parseInt(this.node.namedChild(1).text)

    if (accessType instanceof SingleTypeConstructor && accessType.type instanceof Type && accessType.type.name === NUMBER_TYPE)
      return tupleType.types[index]
    else
      this.errorHandler.throw(
        'Contents of tuple can only be accessed by an accessor of type ' +
        `'Number', but got '${accessType.toString()}'`,
        this.node
      )
  }

  private accessObject = (
    objectType: ObjectType,
    accessType: SingleTypeConstructor
  ): TypeConstructor => {
    const property = this.node.namedChild(1).text

    if (accessType instanceof SingleTypeConstructor && accessType.type instanceof Type && accessType.type.name === STRING_TYPE)
      if (objectType.propertyTypes.has(property))
        return objectType.propertyTypes.get(property)
      else
        this.errorHandler.throw(
          `Module ${objectType.toString()} does not include accessible ` +
          `property '${property}'`,
          this.node
        )
    else
      this.errorHandler.throw(
        'Contents of module can only be accessed by an accessor of type ' +
        `'String', but got '${accessType.toString()}'`,
        this.node
      )
  }
}
