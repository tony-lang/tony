import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'
import { assert } from '../../utilities'

import {
  ObjectRepresentation,
  ParametricType,
  Type,
  TypeConstraints,
  NUMBER_TYPE,
  STRING_TYPE,
  LIST_TYPE,
  MAP_TYPE,
  TUPLE_TYPE
} from '../types'

export class InferAccessType {
  private errorHandler: ErrorHandler
  private node: Parser.SyntaxNode
  private typeConstraints: TypeConstraints

  constructor(node: Parser.SyntaxNode, errorHandler: ErrorHandler, typeConstraints: TypeConstraints) {
    this.node = node
    this.errorHandler = errorHandler
    this.typeConstraints = typeConstraints
  }

  perform = (
    valueType: Type,
    accessType: Type,
    valueRepresentation: ObjectRepresentation
  ): Type => {
    if (valueType instanceof ParametricType) {
      if (valueType.name === LIST_TYPE)
        return this.accessList(valueType, accessType)
      else if (valueType.name === MAP_TYPE)
        return this.accessMap(valueType, accessType)
      else if (valueType.name === TUPLE_TYPE)
        return this.accessTuple(valueType, accessType)
      else
        return this.accessRepresentation(
          valueType,
          accessType,
          valueRepresentation
        )
    }

    this.errorHandler.throw(
      'Access operator cannot be used on values of type ' +
      `'${valueType.toString()}'`,
      this.node
    )
  }

  private accessList = (valueType: ParametricType, accessType: Type): Type => {
    try {
      accessType.unify(new ParametricType(NUMBER_TYPE), this.typeConstraints)
      return valueType.parameters[0]
    } catch (error) {
      this.errorHandler.throw(
        `Type '${accessType.toString()}' not assignable to type ` +
        `'${NUMBER_TYPE}'.\n\n${error.message}`,
        this.node
      )
    }
  }

  private accessMap = (valueType: ParametricType, accessType: Type): Type => {
    try {
      accessType.unify(valueType.parameters[0], this.typeConstraints)
      return valueType.parameters[1]
    } catch (error) {
      this.errorHandler.throw(
        `Type '${accessType.toString()}' not assignable to type ` +
        `'${valueType.parameters[0]}'.\n\n${error.message}`,
        this.node
      )
    }
  }

  private accessTuple = (valueType: ParametricType, accessType: Type): Type => {
    // TODO: implement dynamic access with union types
    try {
      accessType.unify(new ParametricType(NUMBER_TYPE), this.typeConstraints)

      if (this.node.namedChild(1).type === 'shorthand_access_identifier') {
        const shorthandAccessIdentifier = this.node.namedChild(1)
        const index = parseInt(shorthandAccessIdentifier.text)

        return valueType.parameters[index]
      } else assert(false, 'Dynamic tuple access has not been implemented yet.')
    } catch (error) {
      this.errorHandler.throw(
        `Type '${accessType.toString()}' not assignable to type ` +
        `'${NUMBER_TYPE}'.\n\n${error.message}`,
        this.node
      )
    }
  }

  private accessRepresentation = (
    valueType: ParametricType,
    accessType: Type,
    valueRepresentation: ObjectRepresentation
  ): Type => {
    // TODO: implement dynamic access with union types
    try {
      accessType.unify(new ParametricType(STRING_TYPE), this.typeConstraints)

      if (this.node.namedChild(1).type === 'shorthand_access_identifier') {
        const shorthandAccessIdentifier = this.node.namedChild(1)
        const property = shorthandAccessIdentifier.text

        assert(
          valueRepresentation,
          `Object representation of ${valueType.toString()} should be present.`
        )

        return valueRepresentation.findProperty(property).type
      } else
        assert(false, 'Dynamic object access has not been implemented yet.')
    } catch (error) {
      this.errorHandler.throw(
        `Type '${accessType.toString()}' not assignable to type ` +
        `'${STRING_TYPE}'.\n\n${error.message}`,
        this.node
      )
    }
  }
}
