import Parser from 'tree-sitter'

import { ErrorHandler } from '../error_handling'
import { assert } from '../utilities'

import {
  BuildSymbolTable,
  ResolveImport,
  ResolvePatternBindings,
  SymbolTable,
  TypeBinding
} from './symbol_table'
import {
  CheckStringEmbeddingType,
  InferAbstractionType,
  InferAccessType,
  InferApplicationType,
  InferAssignmentType,
  InferDefaultValueType,
  InferListType,
  InferMapType,
  InferRestListType,
  InferRestMapType,
  InferRestTupleType,
  InferSpreadType,
  InferTupleType
} from './type_inference'
import {
  CurriedType,
  ObjectRepresentation,
  ParametricType,
  Type,
  TypeConstraints,
  TypeVariable,
  INTERNAL_PARTIAL_APPLICATION_TYPE_NAME,
  VOID_TYPE,
  BOOLEAN_TYPE,
  NUMBER_TYPE,
  STRING_TYPE,
  REGULAR_EXPRESSION_TYPE,
  MAP_TYPE,
  LIST_TYPE,
  TUPLE_TYPE
} from './types'

export class Analyze {
  private errorHandler: ErrorHandler

  private buildSymbolTable: BuildSymbolTable
  private resolveImport: ResolveImport
  private typeConstraints: TypeConstraints

  constructor(file: string, outputPath: string) {
    this.errorHandler = new ErrorHandler(file)

    this.buildSymbolTable = new BuildSymbolTable(this.errorHandler)
    this.resolveImport =
      new ResolveImport(this, this.errorHandler, file, outputPath)
    this.typeConstraints = new TypeConstraints
  }

  perform = (node: Parser.SyntaxNode): SymbolTable => {
    this.generate(node)
    return this.buildSymbolTable.symbolTable
  }

  generate = (node: Parser.SyntaxNode): Type => {
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
      return new ParametricType(BOOLEAN_TYPE)
    case 'comment':
      return
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
    case 'infix_application':
      return this.generateInfixApplication(node)
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
      return new ParametricType(NUMBER_TYPE)
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
      return new ParametricType(REGULAR_EXPRESSION_TYPE)
    case 'rest_list':
      return this.generateRestList(node)
    case 'rest_map':
      return this.generateRestMap(node)
    case 'rest_tuple':
      return this.generateRestTuple(node)
    case 'shorthand_access_identifier':
      return new ParametricType(STRING_TYPE)
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
    default:
      assert(false, `Could not find generator for AST node '${node.type}'.`)
    }
  }

  private generateAbstraction = (node: Parser.SyntaxNode): Type => {
    const abstractionBranchTypes = node.namedChildren
      .map(child => this.generate(child))

    return new InferAbstractionType(
      node, this.errorHandler, this.typeConstraints
    ).perform(abstractionBranchTypes)
  }

  private generateAbstractionBranch = (node: Parser.SyntaxNode): Type => {
    this.buildSymbolTable.enterAbstraction()
    const parameterTypes = this.generate(node.namedChild(0))
    const bodyType = this.generate(node.namedChild(1))

    assert(parameterTypes instanceof CurriedType, 'Parameters must be curried.')

    this.buildSymbolTable.leaveAbstraction()
    return parameterTypes.concat(bodyType)
  }

  private generateAccess = (node: Parser.SyntaxNode): Type => {
    const valueType = this.generate(node.namedChild(0))
    const accessType = this.generate(node.namedChild(1))

    console.log(valueType.toString())
    assert(
      valueType instanceof ParametricType,
      'Value type in access operator should be a parametric type.'
    )
    const binding = this.buildSymbolTable.resolveBinding(valueType.name, node)

    assert(binding instanceof TypeBinding, 'Should be a type binding.')
    const valueRepresentation = binding.representation

    return new InferAccessType(node, this.errorHandler, this.typeConstraints)
      .perform(valueType, accessType, valueRepresentation)
  }

  private generateApplication = (node: Parser.SyntaxNode): Type => {
    const valueType = this.generate(node.namedChild(0))
    const argumentTypes = this.generate(node.namedChild(1))

    assert(argumentTypes instanceof CurriedType, 'Arguments must be curried')

    return new InferApplicationType(node, this.errorHandler)
      .perform(valueType, argumentTypes)
  }

  private generateArgument = (node: Parser.SyntaxNode): Type => {
    if (node.namedChildCount == 0)
      return new TypeVariable(INTERNAL_PARTIAL_APPLICATION_TYPE_NAME)

    return this.generate(node.namedChild(0))
  }

  private generateArguments = (node: Parser.SyntaxNode): Type => {
    if (node.namedChildCount == 0)
      return new CurriedType([new ParametricType(VOID_TYPE)])

    const argTypes = node.namedChildren
      .map(argNode => this.generate(argNode))
    return new CurriedType(argTypes)
  }

  private generateAssignment = (node: Parser.SyntaxNode): Type => {
    const isExported = this.buildSymbolTable.disableExports()

    const pattern = node.namedChild(0)
    const patternType = this.generate(pattern)
    const presumedBindings =
      new ResolvePatternBindings(this.errorHandler, node, false, isExported)
        .perform(pattern, patternType)
    this.buildSymbolTable.addBindings(presumedBindings, node)

    const valueType = this.generate(node.namedChild(1))

    const bindings =
      new ResolvePatternBindings(this.errorHandler, node, false, isExported)
        .perform(pattern, valueType)
    bindings.forEach(binding => {
      this.buildSymbolTable.resolveBinding(binding.name, node).type =
        binding.type
    })

    return new InferAssignmentType(
      node, this.errorHandler, this.typeConstraints
    ).perform(patternType, valueType)
  }

  private generateBlock = (node: Parser.SyntaxNode): Type => {
    this.buildSymbolTable.enterBlock()
    const expressionTypes = node.namedChildren
      .map(child => this.generate(child))
    this.buildSymbolTable.leaveBlock()

    return expressionTypes[expressionTypes.length - 1]
  }

  private generateExport = (node: Parser.SyntaxNode): Type => {
    this.buildSymbolTable.enableExports()

    const declarationType = this.generate(node.namedChild(0))
    return declarationType
  }

  private generateExpressionPair = (node: Parser.SyntaxNode): Type => {
    const keyType = this.generate(node.namedChild(0))
    const valueType = this.generate(node.namedChild(1))

    return new ParametricType(MAP_TYPE, [keyType, valueType])
  }

  private generateExternalImport = (node: Parser.SyntaxNode): Type => {
    this.buildSymbolTable.symbolTable.addImport(
      this.resolveImport.performExternalImport(node)
    )

    return
  }

  private generateIdentifier = (node: Parser.SyntaxNode): Type => {
    const name = node.text

    return this.buildSymbolTable.resolveBinding(name, node).type
  }

  private generateIdentifierPattern = (node: Parser.SyntaxNode): Type => {
    if (node.namedChildCount == 1) return new TypeVariable

    return this.generate(node.namedChild(1))
  }

  private generateImport = (node: Parser.SyntaxNode): Type => {
    this.buildSymbolTable.symbolTable.addImport(
      this.resolveImport.performImport(node)
    )

    return
  }

  private generateInfixApplication = (node: Parser.SyntaxNode): Type => {
    const leftType = this.generate(node.namedChild(0))
    const abstractionType = this.generate(node.namedChild(1))
    const rightType = this.generate(node.namedChild(2))
    const argumentTypes = new CurriedType([leftType, rightType])

    return new InferApplicationType(node, this.errorHandler)
      .perform(abstractionType, argumentTypes)
  }

  private generateInterpolation = (node: Parser.SyntaxNode): Type =>
    this.generate(node.namedChild(0))

  private generateList = (node: Parser.SyntaxNode): Type => {
    const valueTypes = node.namedChildren.map(child => this.generate(child))

    return new InferListType(node, this.errorHandler, this.typeConstraints)
      .perform(valueTypes)
  }

  private generateListPattern = (node: Parser.SyntaxNode): Type => {
    const valueTypes = node.namedChildren.map(child => this.generate(child))

    return new InferListType(node, this.errorHandler, this.typeConstraints)
      .perform(valueTypes)
  }

  private generateListType = (node: Parser.SyntaxNode): Type => {
    const valueType = this.generate(node.namedChild(0))

    return new ParametricType(LIST_TYPE, [valueType])
  }

  private generateMap = (node: Parser.SyntaxNode): Type => {
    const mapTypes = node.namedChildren.map(child => this.generate(child))

    return new InferMapType(node, this.errorHandler, this.typeConstraints)
      .perform(mapTypes)
  }

  private generateMapPattern = (node: Parser.SyntaxNode): Type => {
    const mapTypes = node.namedChildren.map(child => this.generate(child))

    return new InferMapType(node, this.errorHandler, this.typeConstraints)
      .perform(mapTypes)
  }

  private generateMapType = (node: Parser.SyntaxNode): Type => {
    const keyType = this.generate(node.namedChild(0))
    const valueType = this.generate(node.namedChild(1))

    return new ParametricType(MAP_TYPE, [keyType, valueType])
  }

  private generateModule = (node: Parser.SyntaxNode): Type => {
    const isExported = this.buildSymbolTable.disableExports()

    const type = this.generate(node.namedChild(0))
    const body = node.namedChild(1)

    assert(
      type instanceof ParametricType,
      'Type of declaration must be parametric.'
    )

    this.generate(body)
    const moduleScope = this.buildSymbolTable.currentScope.lastNestedScope
    const representation = new ObjectRepresentation(
      moduleScope.bindings.map(binding => ({
        name: binding.name,
        type: binding.type,
        representation: binding instanceof TypeBinding ?
          binding.representation : undefined
      }))
    )

    const binding = new TypeBinding(type, representation, false, isExported)
    this.buildSymbolTable.addBinding(binding, node)

    return type
  }

  private generateParameters = (node: Parser.SyntaxNode): Type => {
    if (node.namedChildCount == 0)
      return new CurriedType([new ParametricType(VOID_TYPE)])

    const parameterTypes = new CurriedType(
      node.namedChildren.map(parameterNode => this.generate(parameterNode))
    )
    const bindings = new ResolvePatternBindings(this.errorHandler, node, true)
      .perform(node, parameterTypes)
    this.buildSymbolTable.addBindings(bindings, node)

    return parameterTypes
  }

  private generatePattern = (node: Parser.SyntaxNode): Type => {
    const type = this.generate(node.namedChild(0))

    if (node.namedChildCount == 2) {
      const defaultValueType = this.generate(node.namedChild(1))

      return new InferDefaultValueType(
        node, this.errorHandler, this.typeConstraints
      ).perform(type, defaultValueType)
    }

    return type
  }

  private generatePipeline = (node: Parser.SyntaxNode): Type => {
    const argumentType = this.generate(node.namedChild(0))
    const valueType = this.generate(node.namedChild(1))

    return new InferApplicationType(node, this.errorHandler)
      .perform(valueType, new CurriedType([argumentType]))
  }

  private generatePatternPair = (node: Parser.SyntaxNode): Type => {
    const keyType = this.generate(node.namedChild(0))
    const valueType = this.generate(node.namedChild(1))

    return new ParametricType(MAP_TYPE, [keyType, valueType])
  }

  private generateProgram = (node: Parser.SyntaxNode): Type => {
    this.buildSymbolTable.initializeProgram()

    node.namedChildren.map(child => this.generate(child))

    return
  }

  private generateRestList = (node: Parser.SyntaxNode): Type => {
    const typeConstructor = this.generate(node.namedChild(0))

    return new InferRestListType(node, this.errorHandler)
      .perform(typeConstructor)
  }

  private generateRestMap = (node: Parser.SyntaxNode): Type => {
    const typeConstructor = this.generate(node.namedChild(0))

    return new InferRestMapType(node, this.errorHandler)
      .perform(typeConstructor)
  }

  private generateRestTuple = (node: Parser.SyntaxNode): Type => {
    const typeConstructor = this.generate(node.namedChild(0))

    return new InferRestTupleType(node, this.errorHandler)
      .perform(typeConstructor)
  }

  private generateShorthandPairIdentifierPattern = (
    node: Parser.SyntaxNode
  ): Type => {
    const type = this.generate(node.namedChild(0))

    if (node.namedChildCount == 2) {
      const defaultValueType = this.generate(node.namedChild(1))

      return new ParametricType(MAP_TYPE, [
        new ParametricType(STRING_TYPE),
        new InferDefaultValueType(node, this.errorHandler, this.typeConstraints)
          .perform(type, defaultValueType)
      ])
    }

    return new ParametricType(MAP_TYPE, [new ParametricType(STRING_TYPE), type])
  }

  private generateSpread = (node: Parser.SyntaxNode): Type => {
    const valueType = this.generate(node.namedChild(0))

    return new InferSpreadType(node, this.errorHandler).perform(valueType)
  }

  private generateString = (node: Parser.SyntaxNode): Type => {
    const stringEmbeddingTypes = node.namedChildren
      .map(child => this.generate(child))

    new CheckStringEmbeddingType(node, this.errorHandler, this.typeConstraints)
      .perform(stringEmbeddingTypes)

    return new ParametricType(STRING_TYPE)
  }

  private generateTuple = (node: Parser.SyntaxNode): Type => {
    const valueTypes = node.namedChildren
      .filter(child => child.type !== 'spread')
      .map(child => this.generate(child))
    const restValueTypes = node.namedChildren
      .filter(child => child.type === 'spread')
      .map(child => this.generate(child))

    return new InferTupleType(node, this.errorHandler)
      .perform(valueTypes, restValueTypes)
  }

  private generateTuplePattern = (node: Parser.SyntaxNode): Type => {
    const valueTypes = node.namedChildren
      .filter(child => child.type !== 'rest_tuple')
      .map(child => this.generate(child))
    const restValueTypes = node.namedChildren
      .filter(child => child.type === 'rest_tuple')
      .map(child => this.generate(child))

    return new InferTupleType(node, this.errorHandler)
      .perform(valueTypes, restValueTypes)
  }

  private generateTupleType = (node: Parser.SyntaxNode): Type => {
    const valueTypes = node.namedChildren.map(child => this.generate(child))

    return new ParametricType(TUPLE_TYPE, valueTypes)
  }

  private generateType = (node: Parser.SyntaxNode): Type => {
    const name = node.text

    return this.buildSymbolTable.resolveBinding(name, node).type
  }

  private generateTypeConstructor = (node: Parser.SyntaxNode): Type => {
    if (node.namedChildCount == 1) return this.generate(node.namedChild(0))

    const types = node.namedChildren.map(childNode => this.generate(childNode))
    return new CurriedType(types)
  }
}
