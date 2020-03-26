import Parser from 'tree-sitter'

import { ErrorHandler } from '../ErrorHandler'
import {
  ListType,
  MapType,
  ObjectType,
  RestListType,
  TupleType,
  TypeConstructor,
  MISSING_TYPE,
  MISSING_TYPE_NAME,
  VOID_TYPE,
  NUMBER_TYPE,
  STRING_TYPE
} from '../types'

import { GetImport } from './GetImport'
import { InferAccessType } from './InferAccessType'
// import { ParseType } from './ParseType'
import { PatternMatchType } from './PatternMatchType'
import { SymbolTable, Scope, Binding } from './SymbolTable'

export class Analyze {
  private currentScope: Scope
  private errorHandler: ErrorHandler
  private symbolTable: SymbolTable
  private getImport: GetImport

  private exportBindings = false

  constructor(file: string, outputPath: string) {
    this.errorHandler = new ErrorHandler(file)
    this.getImport = new GetImport(file, outputPath)
  }

  perform = (node: Parser.SyntaxNode): SymbolTable => {
    this.generate(node)
    return this.symbolTable
  }

  private generate = (node: Parser.SyntaxNode): TypeConstructor => {
    switch (node.type) {
    case 'abstraction':
      return this.generateAbstraction(node)
    case 'abstraction_branch':
      return this.generateAbstractionBranch(node)
    case 'access':
      return this.generateAccess(node)
    case 'application':
      return this.generateApplication(node)
    case 'argument':
      return this.generateArgument(node)
    case 'arguments':
      return this.generateArguments(node)
    case 'assignment':
      return this.generateAssignment(node)
    case 'block':
      return this.generateBlock(node)
    case 'comment':
      return this.generateComment(node)
    case 'export':
      return this.generateExport(node)
    case 'expression_pair':
      return this.generateExpressionPair(node)
    case 'identifier':
      return this.generateIdentifier(node)
    case 'identifier_pattern':
      return this.generateIdentifierPattern(node)
    case 'interpolation':
      return this.generateInterpolation(node)
    case 'list':
      return this.generateList(node)
    case 'list_type':
      return this.generateListType(node)
    case 'map':
      return this.generateMap(node)
    case 'map_pattern':
      return this.generateMapPattern(node)
    case 'module':
      return this.generateModule(node)
    case 'number':
      return this.generateNumber(node)
    case 'parameters':
      return this.generateParameters(node)
    case 'pattern':
      return this.generatePattern(node)
    case 'pattern_pair':
      return this.generatePatternPair(node)
    case 'program':
      return this.generateProgram(node)
    case 'rest_list':
      return this.generateRestList(node)
    case 'shorthand_access_identifier':
      return this.generateShorthandAccessIdentifier(node)
    case 'shorthand_pair_identifier_pattern':
      return this.generateShorthandPairIdentifierPattern(node)
    case 'string':
      return this.generateString(node)
    case 'tuple':
      return this.generateTuple(node)
    case 'tuple_type':
      return this.generateTupleType(node)
    case 'type':
      return this.generateType(node)
    case 'type_constructor':
      return this.generateTypeConstructor(node)
    default:
      console.log(`Could not find generator for AST node '${node.type}'.`)
      process.exit(1)
    }
  }

  private generateAbstraction = (node: Parser.SyntaxNode): TypeConstructor => {
    const abstractionBranchTypes = node.namedChildren
      .map(child => this.generate(child))
    const abstractionType = abstractionBranchTypes[0]

    if (!abstractionBranchTypes.every(abstractionBranchType => {
      return abstractionBranchType.matches(abstractionType)
    })) this.errorHandler.throw('Abstraction branches have varying types', node)

    if (!abstractionType.isValid())
      this.errorHandler.throw('Abstraction type is invalid', node)

    return abstractionType
  }

  private generateAbstractionBranch = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    this.currentScope = this.currentScope.createScope()
    const parameterTypes = this.generate(node.namedChild(0))
    const bodyType = this.generate(node.namedChild(1))

    this.currentScope = this.currentScope.parentScope
    return new TypeConstructor(parameterTypes.types.concat([bodyType]))
  }

  private generateAccess = (node: Parser.SyntaxNode): TypeConstructor => {
    const leftType = this.generate(node.namedChild(0))
    const rightType = this.generate(node.namedChild(1))

    return new InferAccessType(node, this.errorHandler)
      .perform(leftType, rightType)
  }

  private generateApplication = (node: Parser.SyntaxNode): TypeConstructor => {
    const abstractionType = this.generate(node.namedChild(0))
    const argTypes = this.generate(node.namedChild(1))

    if (abstractionType.matches(VOID_TYPE)) abstractionType.pop()
    if (abstractionType.length <= argTypes.length)
      if (abstractionType.length == 1)
        this.errorHandler.throw(
          'Cannot apply to the non-curried type ' +
          `'${abstractionType.toString()}'`,
          node
        )
      else if (!(abstractionType.types[abstractionType.length - 2]
                 instanceof RestListType))
        this.errorHandler.throw(
          `Expected at most ${abstractionType.length - 1} arguments, but ` +
          `applied ${argTypes.length} arguments`,
          node
        )
    const appliedArgs = argTypes.types.map((argType, i) => {
      if (!abstractionType.types[i].matches(argType))
        this.errorHandler.throw(
          `Expected argument of type '${abstractionType.types[i].toString()}'` +
          `, but got '${argType.toString()}'`,
          node
        )

      return argType.toString() === MISSING_TYPE_NAME ? null : i
    }).filter(i => i !== null)

    return abstractionType.apply(appliedArgs)
  }

  private generateArgument = (node: Parser.SyntaxNode): TypeConstructor => {
    if (node.namedChildCount == 0) return MISSING_TYPE

    const type = this.generate(node.namedChild(0))
    return type
  }

  private generateArguments = (node: Parser.SyntaxNode): TypeConstructor => {
    if (node.namedChildCount == 0) return VOID_TYPE

    const argTypes = node.namedChildren
      .map(argNode => this.generate(argNode))
    return new TypeConstructor(argTypes)
  }

  private generateAssignment = (node: Parser.SyntaxNode): TypeConstructor => {
    // TODO: don't check types in pattern and instead use bindings returned by
    //       running PatternMatchType against expressionType

    const pattern = node.namedChild(0)
    const patternType = this.generate(pattern)
    const isExported = this.exportBindings
    // required if it was previously set to true by the export generator
    this.exportBindings = false
    const expressionType = this.generate(node.namedChild(1))

    if (!expressionType.matches(patternType)) this.errorHandler.throw(
      `Pattern type '${patternType.toString()}' and expression type ` +
      `'${expressionType.toString()}' do not match`,
      node
    )

    const typeArgs = new PatternMatchType(this.errorHandler, node, isExported)
      .perform(pattern, expressionType)
      .map(binding => binding.type)
    return new TypeConstructor([new TupleType(typeArgs)])
  }

  private generateBlock = (node: Parser.SyntaxNode): TypeConstructor => {
    const expressionTypes = node.namedChildren
      .map(child => this.generate(child))

    return expressionTypes[expressionTypes.length - 1]
  }

  private generateComment = (node: Parser.SyntaxNode): TypeConstructor => {
    return
  }

  private generateExport = (node: Parser.SyntaxNode): TypeConstructor => {
    this.exportBindings = true

    const declarationType = this.generate(node.namedChild(0))
    return declarationType
  }

  private generateExpressionPair = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    const keyType = this.generate(node.namedChild(0))
    const valueType = this.generate(node.namedChild(1))

    return new TypeConstructor([new MapType(keyType, valueType)])
  }

  private generateIdentifier = (node: Parser.SyntaxNode): TypeConstructor => {
    const name = node.text

    const binding = this.currentScope.resolveBinding(name)
    if (binding) return binding.type
    else
      this.errorHandler.throw(`Could not find '${name}' in current scope`, node)
  }

  private generateIdentifierPattern = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    const isExported = this.exportBindings

    const name = node.namedChild(0).text
    const typeNode = node.namedChild(1)
    // const type = ParseType.perform(typeNode)
    const type = this.generate(typeNode)

    const binding = new Binding(name, type, isExported)
    const matchingBinding = this.currentScope.resolveBinding(binding.name, 0)
    if (matchingBinding)
      this.errorHandler.throw(
        `A binding with name '${matchingBinding.name}' already exists in the ` +
        'current block',
        node
      )
    this.currentScope.addBinding(binding)

    return type
  }

  private generateInterpolation = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    const type = this.generate(node.namedChild(0))

    return type
  }

  private generateList = (node: Parser.SyntaxNode): TypeConstructor => {
    const valueTypes = node.namedChildren.map(child => this.generate(child))
    const valueType = valueTypes[0]

    if (!valueTypes.every(otherValueType => otherValueType.matches(valueType)))
      this.errorHandler.throw(
        'Values of list have to be of the same type',
        node
      )

    return new TypeConstructor([new ListType(valueType)])
  }

  private generateListType = (node: Parser.SyntaxNode): TypeConstructor => {
    const valueType = this.generate(node.namedChild(0))

    return new TypeConstructor([new ListType(valueType)])
  }

  private generateMap = (node: Parser.SyntaxNode): TypeConstructor => {
    const mapTypes = node.namedChildren.map(child => this.generate(child))
    const mapType = mapTypes[0]

    if (!mapTypes.every(otherMapType => otherMapType.matches(mapType)))
      this.errorHandler.throw(
        'Keys/values of map have to be of the same type',
        node
      )

    return mapType
  }

  private generateMapPattern = (node: Parser.SyntaxNode): TypeConstructor => {
    const objectTypes = node.namedChildren.map(child => this.generate(child))

    return objectTypes.reduce((type, objectType) => new TypeConstructor([
      (type.types[0] as ObjectType).concat(objectType.types[0] as ObjectType)
    ]), new TypeConstructor([new ObjectType(new Map())]))
  }

  private generateModule = (node: Parser.SyntaxNode): TypeConstructor => {
    const isExported = this.exportBindings
    // required if it was previously set to true by the export generator
    this.exportBindings = false

    const name = node.namedChild(0).text
    const body = node.namedChild(1)

    this.currentScope = this.currentScope.createScope()
    this.generate(body)
    const type = new TypeConstructor([
      new ObjectType(this.currentScope.getExportedBindingTypes())
    ])
    this.currentScope = this.currentScope.parentScope

    const binding = new Binding(name, type, isExported)
    const matchingBinding = this.currentScope.resolveBinding(binding.name)
    if (matchingBinding)
      this.errorHandler.throw(
        `A type binding with name '${matchingBinding.name}' already exists ` +
        'in the current scope',
        node
      )
    this.currentScope.addBinding(binding)

    return type
  }

  private generateNumber = (node: Parser.SyntaxNode): TypeConstructor =>
    NUMBER_TYPE

  private generateParameters = (node: Parser.SyntaxNode): TypeConstructor => {
    if (node.namedChildCount == 0) return new TypeConstructor([VOID_TYPE])

    return node.namedChildren
      .map(parameterNode => this.generate(parameterNode))
      .reduce((parameterTypes, parameterType) => {
        return parameterTypes.concat(parameterType)
      }, new TypeConstructor([]))
  }

  private generatePattern = (node: Parser.SyntaxNode): TypeConstructor => {
    const type = this.generate(node.namedChild(0))

    if (node.namedChildCount == 2) {
      const defaultValueType = this.generate(node.namedChild(1))

      if (!defaultValueType.matches(type)) this.errorHandler.throw(
        `Type of default value '${defaultValueType.toString()}' does not ` +
        `match expected type '${type.toString()}'`,
        node
      )

      type.isOptional = true
    }

    return type
  }

  private generatePatternPair = (node: Parser.SyntaxNode): TypeConstructor => {
    const identifierPatternName = node.namedChild(0)
    const pattern = node.namedChild(1)

    return new TypeConstructor([new ObjectType(
      new Map([[identifierPatternName.text, this.generate(pattern)]])
    )])
  }

  private generateProgram = (node: Parser.SyntaxNode): TypeConstructor => {
    this.symbolTable = new SymbolTable()
    this.currentScope = this.symbolTable

    node.namedChildren.map(child => this.generate(child))

    return
  }

  private generateRestList = (node: Parser.SyntaxNode): TypeConstructor => {
    const type = this.generate(node.namedChild(0))

    const atomicType = type.types[0]
    if (type.length == 1 && atomicType instanceof ListType)
      return new TypeConstructor([new RestListType(atomicType)])
    else if (type.length == 1 && atomicType instanceof TupleType)
      return new TypeConstructor(atomicType.types)
    else this.errorHandler.throw(
      `Rest list is either of a list or tuple type, got '${type.toString()}'`,
      node
    )
  }

  private generateShorthandAccessIdentifier = (
    node: Parser.SyntaxNode
  ): TypeConstructor => STRING_TYPE

  private generateShorthandPairIdentifierPattern = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    const identifierPattern = node.namedChild(0)
    const identifierPatternName = identifierPattern.namedChild(0)

    const type = this.generate(identifierPattern)

    if (node.namedChildCount == 2) {
      const defaultValueType = this.generate(node.namedChild(1))

      if (!defaultValueType.matches(type)) this.errorHandler.throw(
        `Type of default value '${defaultValueType.toString()}' does not ` +
        `match expected type '${type.toString()}'`,
        node
      )

      type.isOptional = true
    }

    return new TypeConstructor([new ObjectType(
      new Map([[identifierPatternName.text, type]])
    )])
  }

  private generateString = (node: Parser.SyntaxNode): TypeConstructor => {
    node.namedChildren.forEach(child => {
      const type = this.generate(child)

      if (!type.matches(STRING_TYPE))
        this.errorHandler.throw(
          'String interpolation must return \'String\', instead returned ' +
          `'${type.toString()}'`,
          child
        )
    })

    return STRING_TYPE
  }

  private generateTuple = (node: Parser.SyntaxNode): TypeConstructor => {
    const valueTypes = node.namedChildren.map(child => this.generate(child))

    return new TypeConstructor([new TupleType(valueTypes)])
  }

  private generateTupleType = (node: Parser.SyntaxNode): TypeConstructor => {
    const valueTypes = node.namedChildren.map(child => this.generate(child))

    return new TypeConstructor([new TupleType(valueTypes)])
  }

  private generateType = (node: Parser.SyntaxNode): TypeConstructor => {
    const name = node.text

    const binding = this.currentScope.resolveBinding(name)
    if (binding) return binding.type
    else this.errorHandler.throw(
      `Could not find type '${name}' in current scope`,
      node
    )
  }

  private generateTypeConstructor = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    if (node.namedChildCount == 1) return this.generate(node.namedChild(0))

    const types = node.namedChildren.map(childNode => this.generate(childNode))
    return new TypeConstructor(types)
  }
}
