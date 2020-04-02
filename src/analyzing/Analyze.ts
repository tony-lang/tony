import {
  BOOLEAN_TYPE,
  CurriedType,
  INTERNAL_PARTIAL_APPLICATION_TYPE_NAME,
  LIST_TYPE,
  MAP_TYPE,
  NUMBER_TYPE,
  ObjectRepresentation,
  ParametricType,
  REGULAR_EXPRESSION_TYPE,
  STRING_TYPE,
  TUPLE_TYPE,
  Type,
  TypeConstraints,
  TypeVariable,
  VOID_TYPE,
} from './types'
import {
  Binding,
  BuildSymbolTable,
  ResolveImport,
  ResolvePatternBindings,
  SymbolTable,
  TypeBinding,
  UnifyPatternBindings,
} from './symbol_table'
import { CompileError, InternalError, assert } from '../errors'
import {
  InferAccessType,
  InferApplicationType,
  InferBranchType,
  InferListType,
  InferMapType,
  InferSpreadType,
} from './type_inference'
import Parser from 'tree-sitter'
import { isNotUndefined } from '../utilities'

export class Analyze {
  private buildSymbolTable: BuildSymbolTable
  private filePath: string
  private resolveImport: ResolveImport
  private typeConstraints: TypeConstraints

  // used to communicate type of provided value to when branches
  private caseValueType: Type | undefined
  // used to prevent looking up types when declaring them
  private isDeclaration = false

  constructor(filePath: string) {
    this.buildSymbolTable = new BuildSymbolTable()
    this.filePath = filePath
    this.resolveImport = new ResolveImport(this, filePath)
    this.typeConstraints = new TypeConstraints()
  }

  perform = (node: Parser.SyntaxNode): SymbolTable => {
    assert(node.type === 'program', 'Should be program node.')

    try {
      this.generateProgram(node)
      return this.buildSymbolTable.symbolTable
    } catch (error) {
      if (error instanceof CompileError) error.filePath = this.filePath
      throw error
    }
  }

  generate = (node: Parser.SyntaxNode): Type | undefined => {
    try {
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
          throw new InternalError(
            `Analyze: Could not find generator for AST node '${node.type}'.`,
          )
      }
    } catch (error) {
      if (error instanceof CompileError && error.context === undefined)
        error.addContext(node)
      throw error
    }
  }

  private generateAbstraction = (node: Parser.SyntaxNode): Type => {
    const abstractionBranchTypes = node.namedChildren
      .map((child) => this.generate(child))
      .filter(isNotUndefined)

    return new InferBranchType(this.typeConstraints).perform(
      abstractionBranchTypes,
    )
  }

  private generateAbstractionBranch = (
    node: Parser.SyntaxNode,
  ): CurriedType => {
    this.buildSymbolTable.enterAbstraction()
    const parameterTypes = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(parameterTypes), 'Should be a Type.')
    const bodyType = this.generate(node.namedChild(1)!)
    assert(isNotUndefined(bodyType), 'Should be a Type.')

    this.buildSymbolTable.leaveAbstraction()
    return parameterTypes.concat(bodyType)
  }

  private generateAccess = (node: Parser.SyntaxNode): Type => {
    const valueType = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(valueType), 'Should be a Type.')
    const accessorType = this.generate(node.namedChild(1)!)
    assert(isNotUndefined(accessorType), 'Should be a Type.')

    return new InferAccessType(
      node,
      this.buildSymbolTable,
      this.typeConstraints,
    ).perform(valueType, accessorType)
  }

  private generateApplication = (node: Parser.SyntaxNode): Type => {
    const valueType = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(valueType), 'Should be a Type.')
    const argumentTypes = this.generateArguments(node.namedChild(1)!)

    return new InferApplicationType(this.typeConstraints).perform(
      valueType,
      argumentTypes,
    )
  }

  private generateArgument = (node: Parser.SyntaxNode): Type => {
    if (node.namedChildCount == 0)
      return new TypeVariable(INTERNAL_PARTIAL_APPLICATION_TYPE_NAME)

    const type = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(type), 'Should be a Type.')
    return type
  }

  private generateArguments = (node: Parser.SyntaxNode): CurriedType => {
    if (node.namedChildCount == 0)
      return new CurriedType([new ParametricType(VOID_TYPE)])

    const argumentTypes = node.namedChildren
      .map((child) => this.generate(child))
      .filter(isNotUndefined)
    return new CurriedType(argumentTypes)
  }

  private generateAssignment = (node: Parser.SyntaxNode): Type => {
    const isExported = this.buildSymbolTable.disableExports()

    const pattern = node.namedChild(0)!
    const patternType = this.generate(pattern)
    assert(isNotUndefined(patternType), 'Should be a Type.')
    const presumedBindings = new ResolvePatternBindings(
      this.typeConstraints,
      false,
      isExported,
    ).perform(pattern, patternType)
    this.buildSymbolTable.addBindings(presumedBindings)

    const valueType = this.generate(node.namedChild(1)!)
    assert(isNotUndefined(valueType), 'Should be a Type.')

    const bindings = new ResolvePatternBindings(
      this.typeConstraints,
      false,
      isExported,
    ).perform(pattern, valueType)
    bindings.forEach((binding) => {
      this.buildSymbolTable.resolveBinding(binding.name).type = binding.type
    })

    return patternType.unify(valueType, this.typeConstraints)
  }

  private generateBlock = (node: Parser.SyntaxNode): Type => {
    this.buildSymbolTable.enterBlock()
    const expressionTypes = node.namedChildren
      .map((child) => this.generate(child))
      .filter(isNotUndefined)
    this.buildSymbolTable.leaveBlock()

    return expressionTypes[expressionTypes.length - 1]
  }

  private generateCase = (node: Parser.SyntaxNode): Type => {
    this.caseValueType = this.generate(node.namedChild(0)!)
    const branchTypes = node.namedChildren
      .slice(1)
      .map((child) => this.generate(child))
      .filter(isNotUndefined)

    return new InferBranchType(this.typeConstraints).perform(branchTypes)
  }

  private generateElseIfClause = (node: Parser.SyntaxNode): Type => {
    const conditionType = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(conditionType), 'Should be a Type.')
    const type = this.generate(node.namedChild(1)!)
    assert(isNotUndefined(type), 'Should be a Type.')

    new ParametricType(BOOLEAN_TYPE).unify(conditionType, this.typeConstraints)

    return type
  }

  private generateElseIfClauses = (node: Parser.SyntaxNode): Type => {
    const branchTypes = node.namedChildren
      .map((child) => this.generate(child))
      .filter(isNotUndefined)

    return new InferBranchType(this.typeConstraints).perform(branchTypes)
  }

  private generateExport = (node: Parser.SyntaxNode): Type => {
    this.buildSymbolTable.enableExports()

    const declarationType = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(declarationType), 'Should be a Type.')
    return declarationType
  }

  private generateExpressionPair = (
    node: Parser.SyntaxNode,
  ): ParametricType => {
    const keyType = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(keyType), 'Should be a Type.')
    const valueType = this.generate(node.namedChild(1)!)
    assert(isNotUndefined(valueType), 'Should be a Type.')

    return new ParametricType(MAP_TYPE, [keyType, valueType])
  }

  private generateExternalImport = (node: Parser.SyntaxNode): undefined => {
    this.buildSymbolTable.symbolTable.addImport(
      this.resolveImport.performExternalImport(node),
    )

    return
  }

  private generateGenerator = (node: Parser.SyntaxNode): undefined => {
    const name = node.namedChild(0)!.text
    const valueType = this.generate(node.namedChild(1)!)
    assert(isNotUndefined(valueType), 'Should be a Type.')

    const type = new ParametricType(LIST_TYPE, [new TypeVariable()]).unify(
      valueType,
      this.typeConstraints,
    ).parameters[0]
    const binding = new Binding(name, type, true, false)
    this.buildSymbolTable.addBinding(binding)

    if (node.namedChildCount == 3) this.generate(node.namedChild(2)!)

    return
  }

  private generateGeneratorCondition = (node: Parser.SyntaxNode): undefined => {
    const type = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(type), 'Should be a Type.')

    new ParametricType(BOOLEAN_TYPE).unify(type, this.typeConstraints)

    return
  }

  private generateGenerators = (node: Parser.SyntaxNode): undefined => {
    node.namedChildren.forEach((child) => this.generate(child))

    return
  }

  private generateIdentifier = (node: Parser.SyntaxNode): Type => {
    const name = node.text

    return this.buildSymbolTable.resolveBinding(name).type
  }

  private generateIdentifierPattern = (node: Parser.SyntaxNode): Type => {
    if (node.namedChildCount == 1) return new TypeVariable()

    const type = this.generate(node.namedChild(1)!)
    assert(isNotUndefined(type), 'Should be a Type.')
    return type
  }

  private generateIf = (node: Parser.SyntaxNode): Type => {
    const [conditionType, ...branchTypes] = node.namedChildren
      .map((child) => this.generate(child))
      .filter(isNotUndefined)

    new ParametricType(BOOLEAN_TYPE).unify(conditionType, this.typeConstraints)

    return new InferBranchType(this.typeConstraints).perform(branchTypes)
  }

  private generateImport = (node: Parser.SyntaxNode): undefined => {
    this.buildSymbolTable.symbolTable.addImport(
      this.resolveImport.performImport(node),
    )

    return
  }

  private generateInfixApplication = (node: Parser.SyntaxNode): Type => {
    const leftType = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(leftType), 'Should be a Type.')
    const valueType = this.generate(node.namedChild(1)!)
    assert(isNotUndefined(valueType), 'Should be a Type.')
    const rightType = this.generate(node.namedChild(2)!)
    assert(isNotUndefined(rightType), 'Should be a Type.')
    const argumentTypes = new CurriedType([leftType, rightType])

    return new InferApplicationType(this.typeConstraints).perform(
      valueType,
      argumentTypes,
    )
  }

  private generateInterpolation = (node: Parser.SyntaxNode): Type => {
    const type = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(type), 'Should be a Type.')

    new ParametricType(STRING_TYPE).unify(type, this.typeConstraints)

    return type
  }

  private generateList = (node: Parser.SyntaxNode): ParametricType => {
    const valueTypes = node.namedChildren
      .map((child) => this.generate(child))
      .filter(isNotUndefined)

    return new InferListType(this.typeConstraints).perform(valueTypes)
  }

  private generateListComprehension = (
    node: Parser.SyntaxNode,
  ): ParametricType => {
    this.buildSymbolTable.enterAbstraction()
    this.generate(node.namedChild(1)!)
    const bodyType = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(bodyType), 'Should be a Type.')

    this.buildSymbolTable.leaveAbstraction()
    return new ParametricType(LIST_TYPE, [bodyType])
  }

  private generateListPattern = (node: Parser.SyntaxNode): ParametricType => {
    const valueTypes = node.namedChildren
      .map((child) => this.generate(child))
      .filter(isNotUndefined)

    return new InferListType(this.typeConstraints).perform(valueTypes)
  }

  private generateListType = (node: Parser.SyntaxNode): ParametricType => {
    const valueType = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(valueType), 'Should be a Type.')

    return new ParametricType(LIST_TYPE, [valueType])
  }

  private generateMap = (node: Parser.SyntaxNode): ParametricType => {
    const mapTypes = node.namedChildren
      .map((child) => this.generate(child))
      .filter(isNotUndefined)

    return new InferMapType(this.typeConstraints).perform(mapTypes)
  }

  private generateMapPattern = (node: Parser.SyntaxNode): ParametricType => {
    const mapTypes = node.namedChildren
      .map((child) => this.generate(child))
      .filter(isNotUndefined)

    return new InferMapType(this.typeConstraints).perform(mapTypes)
  }

  private generateMapType = (node: Parser.SyntaxNode): ParametricType => {
    const keyType = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(keyType), 'Should be a Type.')
    const valueType = this.generate(node.namedChild(1)!)
    assert(isNotUndefined(valueType), 'Should be a Type.')

    return new ParametricType(MAP_TYPE, [keyType, valueType])
  }

  private generateModule = (node: Parser.SyntaxNode): ParametricType => {
    const isExported = this.buildSymbolTable.disableExports()

    this.isDeclaration = true
    const type = this.generate(node.namedChild(0)!)
    this.isDeclaration = false
    const body = node.namedChild(1)!

    assert(
      type instanceof ParametricType,
      'Type of declaration must be parametric.',
    )

    this.generate(body)
    const moduleScope = this.buildSymbolTable.currentScope.lastNestedScope
    const representation = new ObjectRepresentation(
      moduleScope.bindings
        .filter((binding) => binding.isExported)
        .map((binding) => ({
          name: binding.name,
          type: binding.type,
          representation:
            binding instanceof TypeBinding ? binding.representation : undefined,
        })),
    )

    const binding = new TypeBinding(type, representation, false, isExported)
    this.buildSymbolTable.addBinding(binding)

    return type
  }

  private generateParameters = (node: Parser.SyntaxNode): CurriedType => {
    if (node.namedChildCount == 0)
      return new CurriedType([new ParametricType(VOID_TYPE)])

    const parameterTypes = new CurriedType(
      node.namedChildren
        .map((parameterNode) => this.generate(parameterNode))
        .filter(isNotUndefined),
    )
    const bindings = new ResolvePatternBindings(
      this.typeConstraints,
      true,
    ).perform(node, parameterTypes)
    this.buildSymbolTable.addBindings(bindings)

    return parameterTypes
  }

  private generatePattern = (node: Parser.SyntaxNode): Type => {
    const type = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(type), 'Should be a Type.')

    if (node.namedChildCount == 2) {
      const defaultValueType = this.generate(node.namedChild(1)!)
      assert(isNotUndefined(defaultValueType), 'Should be a Type.')

      return type.unify(defaultValueType, this.typeConstraints)
    }

    return type
  }

  private generatePatternList = (node: Parser.SyntaxNode): undefined => {
    const bindings = node.namedChildren.map((pattern) => {
      const patternType = this.generate(pattern)
      assert(isNotUndefined(patternType), 'Should be a Type.')
      const inferredPatternType = patternType.unify(
        this.caseValueType as Type,
        this.typeConstraints,
      )

      return new ResolvePatternBindings(this.typeConstraints, true).perform(
        pattern,
        inferredPatternType,
      )
    })
    const unifiedBindings = new UnifyPatternBindings(node).perform(bindings)

    this.buildSymbolTable.addBindings(unifiedBindings)

    return
  }

  private generatePatternPair = (node: Parser.SyntaxNode): ParametricType => {
    const keyType = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(keyType), 'Should be a Type.')
    const valueType = this.generate(node.namedChild(1)!)
    assert(isNotUndefined(valueType), 'Should be a Type.')

    return new ParametricType(MAP_TYPE, [keyType, valueType])
  }

  private generatePipeline = (node: Parser.SyntaxNode): Type => {
    const argumentType = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(argumentType), 'Should be a Type.')
    const valueType = this.generate(node.namedChild(1)!)
    assert(isNotUndefined(valueType), 'Should be a Type.')
    const argumentTypes = new CurriedType([argumentType])

    return new InferApplicationType(this.typeConstraints).perform(
      valueType,
      argumentTypes,
    )
  }

  private generatePrefixApplication = (node: Parser.SyntaxNode): Type => {
    const valueType = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(valueType), 'Should be a Type.')
    const argumentType = this.generate(node.namedChild(1)!)
    assert(isNotUndefined(argumentType), 'Should be a Type.')
    const argumentTypes = new CurriedType([argumentType])

    return new InferApplicationType(this.typeConstraints).perform(
      valueType,
      argumentTypes,
    )
  }

  private generateProgram = (node: Parser.SyntaxNode): undefined => {
    node.namedChildren.forEach((child) => this.generate(child))

    return
  }

  private generateRestList = (node: Parser.SyntaxNode): Type => {
    const type = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(type), 'Should be a Type.')

    return new ParametricType(LIST_TYPE, [new TypeVariable()]).unify(
      type,
      this.typeConstraints,
    ).parameters[0]
  }

  private generateRestMap = (node: Parser.SyntaxNode): ParametricType => {
    const type = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(type), 'Should be a Type.')

    return new ParametricType(MAP_TYPE, [
      new TypeVariable(),
      new TypeVariable(),
    ]).unify(type, this.typeConstraints)
  }

  private generateReturn = (node: Parser.SyntaxNode): Type => {
    const type = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(type), 'Should be a Type.')

    return type
  }

  private generateShorthandPairIdentifierPattern = (
    node: Parser.SyntaxNode,
  ): ParametricType => {
    const type = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(type), 'Should be a Type.')

    if (node.namedChildCount == 2) {
      const defaultValueType = this.generate(node.namedChild(1)!)
      assert(isNotUndefined(defaultValueType), 'Should be a Type.')

      return new ParametricType(MAP_TYPE, [
        new ParametricType(STRING_TYPE),
        type.unify(defaultValueType, this.typeConstraints),
      ])
    }

    return new ParametricType(MAP_TYPE, [new ParametricType(STRING_TYPE), type])
  }

  private generateSpread = (node: Parser.SyntaxNode): Type => {
    const valueType = this.generate(node.namedChild(0)!)
    assert(isNotUndefined(valueType), 'Should be a Type.')

    return new InferSpreadType().perform(valueType)
  }

  private generateString = (node: Parser.SyntaxNode): ParametricType => {
    node.namedChildren.forEach((child) => this.generate(child))

    return new ParametricType(STRING_TYPE)
  }

  private generateTuple = (node: Parser.SyntaxNode): ParametricType => {
    const valueTypes = node.namedChildren
      .map((child) => this.generate(child))
      .filter(isNotUndefined)

    return new ParametricType(TUPLE_TYPE, valueTypes)
  }

  private generateTuplePattern = (node: Parser.SyntaxNode): ParametricType => {
    const valueTypes = node.namedChildren
      .map((child) => this.generate(child))
      .filter(isNotUndefined)

    return new ParametricType(TUPLE_TYPE, valueTypes)
  }

  private generateTupleType = (node: Parser.SyntaxNode): ParametricType => {
    const valueTypes = node.namedChildren
      .map((child) => this.generate(child))
      .filter(isNotUndefined)

    return new ParametricType(TUPLE_TYPE, valueTypes)
  }

  private generateType = (node: Parser.SyntaxNode): Type => {
    const name = node.text

    if (this.isDeclaration) return new ParametricType(name)
    else return this.buildSymbolTable.resolveBinding(name).type
  }

  private generateTypeConstructor = (node: Parser.SyntaxNode): Type => {
    if (node.namedChildCount == 1) {
      const type = this.generate(node.namedChild(0)!)
      assert(isNotUndefined(type), 'Should be a Type.')

      return type
    }

    const types = node.namedChildren
      .map((childNode) => this.generate(childNode))
      .filter(isNotUndefined)
    return new CurriedType(types)
  }

  private generateWhenClause = (node: Parser.SyntaxNode): Type => {
    this.buildSymbolTable.enterAbstraction()
    this.generate(node.namedChild(0)!)
    const type = this.generate(node.namedChild(1)!)
    assert(isNotUndefined(type), 'Should be a Type.')

    this.buildSymbolTable.leaveAbstraction()
    return type
  }

  private generateWhenClauses = (node: Parser.SyntaxNode): Type => {
    const branchTypes = node.namedChildren
      .map((child) => this.generate(child))
      .filter(isNotUndefined)

    return new InferBranchType(this.typeConstraints).perform(branchTypes)
  }
}
