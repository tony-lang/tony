import Parser from 'tree-sitter'

import { ErrorHandler } from '../ErrorHandler'
import {
  ListType,
  MapType,
  ModuleType,
  TupleType,
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
    if (valueType.length != 1) this.errorHandler.throw(
      'Access operator cannot be used on values of type ' +
      `'${valueType.toString()}'`,
      this.node
    )

    const atomicValueType = valueType.types[0]
    if (atomicValueType instanceof ListType)
      return this.accessList(atomicValueType, accessType)
    else if (atomicValueType instanceof MapType)
      return this.accessMap(atomicValueType, accessType)
    else if (this.node.namedChild(1).type === 'shorthand_access_identifier')
      if (atomicValueType instanceof TupleType)
        return this.accessTuple(atomicValueType, accessType)
      else if (atomicValueType instanceof ModuleType)
        return this.accessModule(atomicValueType, accessType)
      else
        this.errorHandler.throw(
          'Access operator cannot be used on values of type ' +
          `'${atomicValueType.toString()}'`,
          this.node
        )
    else {
      console.log('not implemented yet, has to wait for union types')
      process.exit(1)
    }
  }

  private accessList = (
    listType: ListType,
    accessType: TypeConstructor
  ): TypeConstructor => {
    if (accessType.matches(NUMBER_TYPE)) return listType.type
    else
      this.errorHandler.throw(
        'Contents of list can only be accessed by an accessor of type ' +
        `'Number', but got '${accessType.toString()}'`,
        this.node
      )
  }

  private accessMap = (
    mapType: MapType,
    accessType: TypeConstructor
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
    accessType: TypeConstructor
  ): TypeConstructor => {
    const index = parseInt(this.node.namedChild(1).text)

    if (accessType.matches(NUMBER_TYPE))
      return tupleType.types[index]
    else
      this.errorHandler.throw(
        'Contents of tuple can only be accessed by an accessor of type ' +
        `'Number', but got '${accessType.toString()}'`,
        this.node
      )
  }

  private accessModule = (
    moduleType: ModuleType,
    accessType: TypeConstructor
  ): TypeConstructor => {
    const property = this.node.namedChild(1).text

    if (accessType.matches(STRING_TYPE))
      if (moduleType.propertyTypes.has(property))
        return moduleType.propertyTypes.get(property)
      else
        this.errorHandler.throw(
          `Module ${moduleType.toString()} does not include accessible ` +
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
