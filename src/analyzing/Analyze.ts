import Parser from 'tree-sitter'

import { ErrorHandler } from '../error_handling'
import { assert } from '../utilities'

import {
  Binding,
  BuildSymbolTable,
  ResolveImport,
  ResolvePatternBindings,
  SymbolTable
} from './symbol_table'
import {
  CheckDefaultValueType,
  CheckStringEmbeddingType,
  InferAbstractionType,
  InferAccessType,
  InferApplicationType,
  InferAssignmentType,
  InferListType,
  InferMapType,
  InferMapPatternType,
  InferRestListType,
  InferRestMapType,
  InferSpreadType,
  InferTupleType
} from './type_inference'
import {
  CurriedTypeConstructor,
  ListType,
  MapType,
  ObjectType,
  SingleTypeConstructor,
  TupleType,
  TypeConstructor,
  MISSING_TYPE,
  VOID_TYPE,
  BOOLEAN_TYPE,
  NUMBER_TYPE,
  STRING_TYPE,
  REGULAR_EXPRESSION_TYPE
} from './types'

export class Analyze {
  private errorHandler: ErrorHandler

  private buildSymbolTable: BuildSymbolTable
  private resolveImport: ResolveImport

  constructor(file: string, outputPath: string) {
    this.errorHandler = new ErrorHandler(file)

    this.buildSymbolTable = new BuildSymbolTable(this.errorHandler)
    this.resolveImport =
      new ResolveImport(this, this.errorHandler, file, outputPath)
  }

  perform = (node: Parser.SyntaxNode): SymbolTable => {
    this.generate(node)
    return this.buildSymbolTable.symbolTable
  }

  generate = (node: Parser.SyntaxNode): TypeConstructor => {
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
    case 'boolean':
      return this.generateBoolean(node)
    case 'comment':
      return this.generateComment(node)
    case 'export':
      return this.generateExport(node)
    case 'expression_pair':
      return this.generateExpressionPair(node)
    case 'external_import':
      return this.generateExternalImport(node)
    case 'identifier':
      return this.generateIdentifier(node)
    case 'identifier_pattern':
      return this.generateIdentifierPattern(node)
    case 'import':
      return this.generateImport(node)
    case 'interpolation':
      return this.generateInterpolation(node)
    case 'list':
      return this.generateList(node)
    case 'list_pattern':
      return this.generateListPattern(node)
    case 'list_type':
      return this.generateListType(node)
    case 'map':
      return this.generateMap(node)
    case 'map_pattern':
      return this.generateMapPattern(node)
    case 'map_type':
      return this.generateMapType(node)
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
    case 'pipeline':
      return this.generatePipeline(node)
    case 'program':
      return this.generateProgram(node)
    case 'regex':
      return this.generateRegex(node)
    case 'rest_list':
      return this.generateRestList(node)
    case 'rest_list_type':
      return this.generateRestListType(node)
    case 'rest_map':
      return this.generateRestMap(node)
    case 'shorthand_access_identifier':
      return this.generateShorthandAccessIdentifier(node)
    case 'shorthand_pair_identifier_pattern':
      return this.generateShorthandPairIdentifierPattern(node)
    case 'spread':
      return this.generateSpread(node)
    case 'string':
      return this.generateString(node)
    case 'tuple':
      return this.generateTuple(node)
    case 'tuple_pattern':
      return this.generateTuplePattern(node)
    case 'tuple_type':
      return this.generateTupleType(node)
    case 'type':
      return this.generateType(node)
    case 'type_constructor':
      return this.generateTypeConstructor(node)
    case 'type_interpretation':
      return this.generateTypeInterpretation(node)
    default:
      assert(false, `Could not find generator for AST node '${node.type}'.`)
    }
  }

  private generateAbstraction = (node: Parser.SyntaxNode): TypeConstructor => {
    const abstractionBranchTypes = node.namedChildren
      .map(child => this.generate(child))

    return new InferAbstractionType(node, this.errorHandler)
      .perform(abstractionBranchTypes)
  }

  private generateAbstractionBranch = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    this.buildSymbolTable.enterAbstraction()
    const parameterTypes = this.generate(node.namedChild(0))
    const bodyType = this.generate(node.namedChild(1))

    assert(
      parameterTypes instanceof CurriedTypeConstructor,
      'Parameters must be curried.'
    )

    this.buildSymbolTable.leaveAbstraction()
    return parameterTypes.concat(bodyType, false)
  }

  private generateAccess = (node: Parser.SyntaxNode): TypeConstructor => {
    const valueType = this.generate(node.namedChild(0))
    const accessType = this.generate(node.namedChild(1))

    return new InferAccessType(node, this.errorHandler)
      .perform(valueType, accessType)
  }

  private generateApplication = (node: Parser.SyntaxNode): TypeConstructor => {
    const valueType = this.generate(node.namedChild(0))
    const argumentTypes = this.generate(node.namedChild(1))

    assert(
      argumentTypes instanceof CurriedTypeConstructor,
      'Arguments must be curried'
    )

    return new InferApplicationType(node, this.errorHandler)
      .perform(valueType, argumentTypes)
  }

  private generateArgument = (node: Parser.SyntaxNode): TypeConstructor => {
    if (node.namedChildCount == 0) return MISSING_TYPE

    const type = this.generate(node.namedChild(0))
    return type
  }

  private generateArguments = (node: Parser.SyntaxNode): TypeConstructor => {
    if (node.namedChildCount == 0)
      return new CurriedTypeConstructor([VOID_TYPE])

    const argTypes = node.namedChildren
      .map(argNode => this.generate(argNode))
    return new CurriedTypeConstructor(argTypes)
  }

  private generateAssignment = (node: Parser.SyntaxNode): TypeConstructor => {
    const isExported = this.buildSymbolTable.disableExports()

    const pattern = node.namedChild(0)
    const patternType = this.generate(pattern)
    const valueType = this.generate(node.namedChild(1))

    const usedType = valueType.isValid() ? valueType : patternType
    const bindings =
      new ResolvePatternBindings(this.errorHandler, node, false, isExported)
        .perform(pattern, usedType)
    this.buildSymbolTable.addBindings(bindings, node)

    return new InferAssignmentType(node, this.errorHandler)
      .perform(patternType, valueType)
  }

  private generateBlock = (node: Parser.SyntaxNode): TypeConstructor => {
    this.buildSymbolTable.enterBlock()
    const expressionTypes = node.namedChildren
      .map(child => this.generate(child))
    this.buildSymbolTable.leaveBlock()

    return expressionTypes[expressionTypes.length - 1]
  }

  private generateBoolean = (node: Parser.SyntaxNode): TypeConstructor =>
    BOOLEAN_TYPE

  private generateComment = (node: Parser.SyntaxNode): TypeConstructor => {
    return
  }

  private generateExport = (node: Parser.SyntaxNode): TypeConstructor => {
    this.buildSymbolTable.enableExports()

    const declarationType = this.generate(node.namedChild(0))
    return declarationType
  }

  private generateExpressionPair = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    const keyType = this.generate(node.namedChild(0))
    const valueType = this.generate(node.namedChild(1))

    return new SingleTypeConstructor(new MapType(keyType, valueType))
  }

  private generateExternalImport = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    this.buildSymbolTable.symbolTable.addImport(
      this.resolveImport.performExternalImport(node)
    )

    return
  }

  private generateIdentifier = (node: Parser.SyntaxNode): TypeConstructor => {
    const name = node.text

    return this.buildSymbolTable.resolveBinding(name, node).type
  }

  private generateIdentifierPattern = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    if (node.namedChildCount == 1) return MISSING_TYPE

    const type = this.generate(node.namedChild(1))
    return type
  }

  private generateImport = (node: Parser.SyntaxNode): TypeConstructor => {
    this.buildSymbolTable.symbolTable.addImport(
      this.resolveImport.performImport(node)
    )

    return
  }

  private generateInterpolation = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    const type = this.generate(node.namedChild(0))

    return type
  }

  private generateList = (node: Parser.SyntaxNode): TypeConstructor => {
    const valueTypes = node.namedChildren.map(child => this.generate(child))

    return new InferListType(node, this.errorHandler).perform(valueTypes)
  }

  private generateListPattern = (node: Parser.SyntaxNode): TypeConstructor => {
    const valueTypes = node.namedChildren.map(valueNode => {
      const valueType = this.generate(valueNode)

      if (valueType instanceof SingleTypeConstructor &&
          valueType.type instanceof ListType && valueType.type.isRest)
        return valueType.type.type
      else return valueType
    })

    return new InferListType(node, this.errorHandler).perform(valueTypes)
  }

  private generateListType = (node: Parser.SyntaxNode): TypeConstructor => {
    const valueType = this.generate(node.namedChild(0))

    return new SingleTypeConstructor(new ListType(valueType))
  }

  private generateMap = (node: Parser.SyntaxNode): TypeConstructor => {
    const mapTypes = node.namedChildren.map(child => this.generate(child))

    return new InferMapType(node, this.errorHandler).perform(mapTypes)
  }

  private generateMapPattern = (node: Parser.SyntaxNode): TypeConstructor => {
    const objectTypes = node.namedChildren.map(child => this.generate(child))

    return new InferMapPatternType(node, this.errorHandler).perform(objectTypes)
  }

  private generateMapType = (node: Parser.SyntaxNode): TypeConstructor => {
    const keyType = this.generate(node.namedChild(0))
    const valueType = this.generate(node.namedChild(1))

    return new SingleTypeConstructor(new MapType(keyType, valueType))
  }

  private generateModule = (node: Parser.SyntaxNode): TypeConstructor => {
    const isExported = this.buildSymbolTable.disableExports()

    const name = node.namedChild(0).text
    const body = node.namedChild(1)

    this.generate(body)
    const type = new SingleTypeConstructor(new ObjectType(
      this.buildSymbolTable.currentScope.lastNestedScope
        .getExportedBindingTypes()
    ))

    const binding = new Binding(name, type, false, isExported)
    this.buildSymbolTable.addTypeBinding(binding, node)

    return type
  }

  private generateNumber = (node: Parser.SyntaxNode): TypeConstructor =>
    NUMBER_TYPE

  private generateParameters = (node: Parser.SyntaxNode): TypeConstructor => {
    if (node.namedChildCount == 0)
      return new CurriedTypeConstructor([VOID_TYPE])

    const parameterTypes = node.namedChildren
      .map(parameterNode => this.generate(parameterNode))
      .reduce((parameterTypes: CurriedTypeConstructor, parameterType) => {
        return parameterTypes.concat(parameterType)
      }, new CurriedTypeConstructor([]))

    const bindings = new ResolvePatternBindings(this.errorHandler, node, true)
      .perform(node, parameterTypes)
    this.buildSymbolTable.addBindings(bindings, node)

    return parameterTypes
  }

  private generatePattern = (node: Parser.SyntaxNode): TypeConstructor => {
    const type = this.generate(node.namedChild(0))

    if (node.namedChildCount == 2) {
      const defaultValueType = this.generate(node.namedChild(1))

      new CheckDefaultValueType(node, this.errorHandler)
        .perform(type, defaultValueType)
    }

    return type
  }

  private generatePipeline = (node: Parser.SyntaxNode): TypeConstructor => {
    const argumentType = this.generate(node.namedChild(0))
    const valueType = this.generate(node.namedChild(1))

    return new InferApplicationType(node, this.errorHandler)
      .perform(valueType, new CurriedTypeConstructor([argumentType]))
  }

  private generatePatternPair = (node: Parser.SyntaxNode): TypeConstructor => {
    const identifierPatternName = node.namedChild(0)
    const pattern = node.namedChild(1)

    return new SingleTypeConstructor(new ObjectType(
      new Map([[identifierPatternName.text, this.generate(pattern)]])
    ))
  }

  private generateProgram = (node: Parser.SyntaxNode): TypeConstructor => {
    this.buildSymbolTable.initializeProgram()

    node.namedChildren.map(child => this.generate(child))

    return
  }

  private generateRegex = (node: Parser.SyntaxNode): TypeConstructor =>
    REGULAR_EXPRESSION_TYPE

  private generateRestList = (node: Parser.SyntaxNode): TypeConstructor => {
    const typeConstructor = this.generate(node.namedChild(0))

    return new InferRestListType(node, this.errorHandler)
      .perform(typeConstructor)
  }

  private generateRestListType = (node: Parser.SyntaxNode): TypeConstructor => {
    const typeConstructor = this.generate(node.namedChild(0))

    return new InferRestListType(node, this.errorHandler)
      .perform(typeConstructor, false)
  }

  private generateRestMap = (node: Parser.SyntaxNode): TypeConstructor => {
    const typeConstructor = this.generate(node.namedChild(0))

    return new InferRestMapType(node, this.errorHandler)
      .perform(typeConstructor)
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

      new CheckDefaultValueType(node, this.errorHandler)
        .perform(type, defaultValueType)
    }

    return new SingleTypeConstructor(new ObjectType(
      new Map([[identifierPatternName.text, type]])
    ))
  }

  private generateSpread = (node: Parser.SyntaxNode): TypeConstructor => {
    const valueType = this.generate(node.namedChild(0))

    return new InferSpreadType(node, this.errorHandler).perform(valueType)
  }

  private generateString = (node: Parser.SyntaxNode): TypeConstructor => {
    const stringEmbeddingTypes = node.namedChildren
      .map(child => this.generate(child))

    new CheckStringEmbeddingType(node, this.errorHandler)
      .perform(stringEmbeddingTypes)

    return STRING_TYPE
  }

  private generateTuple = (node: Parser.SyntaxNode): TypeConstructor => {
    const valueTypes = node.namedChildren.map(child => this.generate(child))

    return new InferTupleType().perform(valueTypes)
  }

  private generateTuplePattern = (node: Parser.SyntaxNode): TypeConstructor => {
    const valueTypes = node.namedChildren.map(child => this.generate(child))

    return new InferTupleType().perform(valueTypes)
  }

  private generateTupleType = (node: Parser.SyntaxNode): TypeConstructor => {
    const valueTypes = node.namedChildren.map(child => this.generate(child))

    return new SingleTypeConstructor(new TupleType(valueTypes))
  }

  private generateType = (node: Parser.SyntaxNode): TypeConstructor => {
    const name = node.text

    return this.buildSymbolTable.resolveBinding(name, node).type
  }

  private generateTypeConstructor = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    if (node.namedChildCount == 1) return this.generate(node.namedChild(0))

    const types = node.namedChildren.map(childNode => this.generate(childNode))
    return new CurriedTypeConstructor(types)
  }

  private generateTypeInterpretation = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    const valueNode = node.namedChild(0)
    const type = this.generate(node.namedChild(1))

    this.generate(valueNode)

    return type
  }
}
