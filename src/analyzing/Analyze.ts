import Parser from 'tree-sitter'

import { ErrorHandler } from '../error_handling'
import { assert } from '../utilities'

import {
  Binding,
  BuildSymbolTable,
  ResolveImport,
  ResolvePatternBindings,
  SymbolTable,
  TypeBinding,
  UnifyPatternBindings
} from './symbol_table'
import {
  CheckConditionType,
  CheckStringEmbeddingType,
  InferAccessType,
  InferApplicationType,
  InferAssignmentType,
  InferBranchType,
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

  // used to communicate type of provided value to when branches
  private caseValueType: Type
  // used to prevent looking up types when declaring them
  private isDeclaration = false

  constructor(file: string) {
    this.errorHandler = new ErrorHandler(file)

    this.buildSymbolTable = new BuildSymbolTable(this.errorHandler)
    this.resolveImport =
      new ResolveImport(this, this.errorHandler, file)
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
    case 'case':
      return this.generateCase(node)
    case 'comment':
      return
    case 'escape_sequence':
      return new ParametricType(STRING_TYPE)
    case 'else_if_clause':
      return this.generateElseIfClause(node)
    case 'else_if_clauses':
      return this.generateElseIfClauses(node)
    case 'export':
      return this.generateExport(node)
    case 'expression_pair':
      return this.generateExpressionPair(node)
    case 'external_import':
      return this.generateExternalImport(node)
    case 'generator':
      return this.generateGenerator(node)
    case 'generator_condition':
      return this.generateGeneratorCondition(node)
    case 'generators':
      return this.generateGenerators(node)
    case 'identifier':
      return this.generateIdentifier(node)
    case 'identifier_pattern':
      return this.generateIdentifierPattern(node)
    case 'if':
      return this.generateIf(node)
    case 'import':
      return this.generateImport(node)
    case 'infix_application':
      return this.generateInfixApplication(node)
    case 'interpolation':
      return this.generateInterpolation(node)
    case 'list':
      return this.generateList(node)
    case 'list_comprehension':
      return this.generateListComprehension(node)
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
    case 'pattern_list':
      return this.generatePatternList(node)
    case 'pattern_pair':
      return this.generatePatternPair(node)
    case 'pipeline':
      return this.generatePipeline(node)
    case 'prefix_application':
      return this.generatePrefixApplication(node)
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
    case 'return':
      return this.generateReturn(node)
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
    case 'when_clause':
      return this.generateWhenClause(node)
    case 'when_clauses':
      return this.generateWhenClauses(node)
    default:
      assert(false, `Could not find generator for AST node '${node.type}'.`)
    }
  }

  private generateAbstraction = (node: Parser.SyntaxNode): Type => {
    const abstractionBranchTypes = node.namedChildren
      .map(child => this.generate(child))
      .filter(type => type !== undefined)

    return new InferBranchType(
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

    return new InferAccessType(
      node, this.errorHandler, this.buildSymbolTable, this.typeConstraints
    ).perform(valueType, accessType)
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
      .map(child => this.generate(child))
      .filter(type => type !== undefined)
    return new CurriedType(argTypes)
  }

  private generateAssignment = (node: Parser.SyntaxNode): Type => {
    const isExported = this.buildSymbolTable.disableExports()

    const pattern = node.namedChild(0)
    const patternType = this.generate(pattern)
    const presumedBindings =
      new ResolvePatternBindings(this.errorHandler, false, isExported)
        .perform(pattern, patternType)
    this.buildSymbolTable.addBindings(presumedBindings, node)

    const valueType = this.generate(node.namedChild(1))

    const bindings =
      new ResolvePatternBindings(this.errorHandler, false, isExported)
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
      .filter(type => type !== undefined)
    this.buildSymbolTable.leaveBlock()

    return expressionTypes[expressionTypes.length - 1]
  }

  private generateCase = (node: Parser.SyntaxNode): Type => {
    this.caseValueType = this.generate(node.namedChild(0))
    const branchTypes = node.namedChildren
      .slice(1)
      .map(child => this.generate(child))
      .filter(type => type !== undefined)

    return new InferBranchType(node, this.errorHandler, this.typeConstraints)
      .perform(branchTypes)
  }

  private generateElseIfClause = (node: Parser.SyntaxNode): Type => {
    const conditionType = this.generate(node.namedChild(0))
    const type = this.generate(node.namedChild(1))

    new CheckConditionType(node, this.errorHandler, this.typeConstraints)
      .perform(conditionType)

    return type
  }

  private generateElseIfClauses = (node: Parser.SyntaxNode): Type => {
    const branchTypes = node.namedChildren
      .map(child => this.generate(child))
      .filter(type => type !== undefined)

    return new InferBranchType(node, this.errorHandler, this.typeConstraints)
      .perform(branchTypes)
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

  private generateGenerator = (node: Parser.SyntaxNode): Type => {
    const name = node.namedChild(0).text
    const valueType = this.generate(node.namedChild(1))

    const type = new InferRestListType(
      node, this.errorHandler, this.typeConstraints
    ).perform(valueType)
    this.buildSymbolTable.addBinding(
      new Binding(name, type, true, false),
      node
    )

    if (node.namedChildCount == 3) this.generate(node.namedChild(2))

    return
  }

  private generateGeneratorCondition = (node: Parser.SyntaxNode): Type => {
    const type = this.generate(node.namedChild(0))

    new CheckConditionType(node, this.errorHandler, this.typeConstraints)
      .perform(type)

    return
  }

  private generateGenerators = (node: Parser.SyntaxNode): Type => {
    node.namedChildren.map(child => this.generate(child))

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

  private generateIf = (node: Parser.SyntaxNode): Type => {
    const [conditionType, ...branchTypes] = node.namedChildren
      .map(child => this.generate(child))
      .filter(type => type !== undefined)

    new CheckConditionType(node, this.errorHandler, this.typeConstraints)
      .perform(conditionType)

    return new InferBranchType(node, this.errorHandler, this.typeConstraints)
      .perform(branchTypes)
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
    const valueTypes = node.namedChildren
      .map(child => this.generate(child))
      .filter(type => type !== undefined)

    return new InferListType(node, this.errorHandler, this.typeConstraints)
      .perform(valueTypes)
  }

  private generateListComprehension = (node: Parser.SyntaxNode): Type => {
    this.buildSymbolTable.enterAbstraction()
    this.generate(node.namedChild(1))
    const bodyType = this.generate(node.namedChild(0))

    this.buildSymbolTable.leaveAbstraction()
    return new ParametricType(LIST_TYPE, [bodyType])
  }

  private generateListPattern = (node: Parser.SyntaxNode): Type => {
    const valueTypes = node.namedChildren
      .map(child => this.generate(child))
      .filter(type => type !== undefined)

    return new InferListType(node, this.errorHandler, this.typeConstraints)
      .perform(valueTypes)
  }

  private generateListType = (node: Parser.SyntaxNode): Type => {
    const valueType = this.generate(node.namedChild(0))

    return new ParametricType(LIST_TYPE, [valueType])
  }

  private generateMap = (node: Parser.SyntaxNode): Type => {
    const mapTypes = node.namedChildren
      .map(child => this.generate(child))
      .filter(type => type !== undefined)

    return new InferMapType(node, this.errorHandler, this.typeConstraints)
      .perform(mapTypes)
  }

  private generateMapPattern = (node: Parser.SyntaxNode): Type => {
    const mapTypes = node.namedChildren
      .map(child => this.generate(child))
      .filter(type => type !== undefined)

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

    this.isDeclaration = true
    const type = this.generate(node.namedChild(0))
    this.isDeclaration = false
    const body = node.namedChild(1)

    assert(
      type instanceof ParametricType,
      'Type of declaration must be parametric.'
    )

    this.generate(body)
    const moduleScope = this.buildSymbolTable.currentScope.lastNestedScope
    const representation = new ObjectRepresentation(
      moduleScope.bindings
        .filter(binding => binding.isExported)
        .map(binding => ({
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
      node.namedChildren
        .map(parameterNode => this.generate(parameterNode))
        .filter(type => type !== undefined)
    )
    const bindings = new ResolvePatternBindings(this.errorHandler, true)
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

  private generatePatternList = (node: Parser.SyntaxNode): Type => {
    const bindings = node.namedChildren.map(pattern => {
      const patternType = this.generate(pattern)
      const inferredPatternType = new InferAssignmentType(
        node, this.errorHandler, this.typeConstraints
      ).perform(patternType, this.caseValueType)

      return new ResolvePatternBindings(this.errorHandler, true)
        .perform(pattern, inferredPatternType)
    })
    const unifiedBindings = new UnifyPatternBindings(node, this.errorHandler)
      .perform(bindings)

    this.buildSymbolTable.addBindings(unifiedBindings, node)

    return
  }

  private generatePatternPair = (node: Parser.SyntaxNode): Type => {
    const keyType = this.generate(node.namedChild(0))
    const valueType = this.generate(node.namedChild(1))

    return new ParametricType(MAP_TYPE, [keyType, valueType])
  }

  private generatePipeline = (node: Parser.SyntaxNode): Type => {
    const argumentType = this.generate(node.namedChild(0))
    const valueType = this.generate(node.namedChild(1))

    return new InferApplicationType(node, this.errorHandler)
      .perform(valueType, new CurriedType([argumentType]))
  }

  private generatePrefixApplication = (node: Parser.SyntaxNode): Type => {
    const abstractionType = this.generate(node.namedChild(0))
    const argumentTypes = new CurriedType([this.generate(node.namedChild(1))])

    return new InferApplicationType(node, this.errorHandler)
      .perform(abstractionType, argumentTypes)
  }

  private generateProgram = (node: Parser.SyntaxNode): Type => {
    this.buildSymbolTable.initializeProgram()

    node.namedChildren.map(child => this.generate(child))

    return
  }

  private generateRestList = (node: Parser.SyntaxNode): Type => {
    const typeConstructor = this.generate(node.namedChild(0))

    return new InferRestListType(node, this.errorHandler, this.typeConstraints)
      .perform(typeConstructor)
  }

  private generateRestMap = (node: Parser.SyntaxNode): Type => {
    const typeConstructor = this.generate(node.namedChild(0))

    return new InferRestMapType(node, this.errorHandler, this.typeConstraints)
      .perform(typeConstructor)
  }

  private generateRestTuple = (node: Parser.SyntaxNode): Type => {
    const typeConstructor = this.generate(node.namedChild(0))

    return new InferRestTupleType(node, this.errorHandler)
      .perform(typeConstructor)
  }

  private generateReturn = (node: Parser.SyntaxNode): Type =>
    this.generate(node.namedChild(0))

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
      .filter(type => type !== undefined)

    new CheckStringEmbeddingType(node, this.errorHandler, this.typeConstraints)
      .perform(stringEmbeddingTypes)

    return new ParametricType(STRING_TYPE)
  }

  private generateTuple = (node: Parser.SyntaxNode): Type => {
    const valueTypes = node.namedChildren
      .filter(child => child.type !== 'spread')
      .map(child => this.generate(child))
      .filter(type => type !== undefined)
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
      .filter(type => type !== undefined)
    const restValueTypes = node.namedChildren
      .filter(child => child.type === 'rest_tuple')
      .map(child => this.generate(child))

    return new InferTupleType(node, this.errorHandler)
      .perform(valueTypes, restValueTypes)
  }

  private generateTupleType = (node: Parser.SyntaxNode): Type => {
    const valueTypes = node.namedChildren
      .map(child => this.generate(child))
      .filter(type => type !== undefined)

    return new ParametricType(TUPLE_TYPE, valueTypes)
  }

  private generateType = (node: Parser.SyntaxNode): Type => {
    const name = node.text

    if (this.isDeclaration) return new ParametricType(name)
    else return this.buildSymbolTable.resolveBinding(name, node).type
  }

  private generateTypeConstructor = (node: Parser.SyntaxNode): Type => {
    if (node.namedChildCount == 1) return this.generate(node.namedChild(0))

    const types = node.namedChildren
      .map(childNode => this.generate(childNode))
      .filter(type => type !== undefined)
    return new CurriedType(types)
  }

  private generateWhenClause = (node: Parser.SyntaxNode): Type => {
    this.buildSymbolTable.enterAbstraction()
    this.generate(node.namedChild(0))
    const type = this.generate(node.namedChild(1))

    this.buildSymbolTable.leaveAbstraction()
    return type
  }

  private generateWhenClauses = (node: Parser.SyntaxNode): Type => {
    const branchTypes = node.namedChildren
      .map(child => this.generate(child))
      .filter(type => type !== undefined)

    return new InferBranchType(node, this.errorHandler, this.typeConstraints)
      .perform(branchTypes)
  }
}
