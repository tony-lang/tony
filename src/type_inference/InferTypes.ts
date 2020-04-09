import {
  BOOLEAN_TYPE,
  BuildType,
  CurriedType,
  INTERNAL_PARTIAL_APPLICATION_TYPE_NAME,
  LIST_TYPE,
  MAP_TYPE,
  NUMBER_TYPE,
  ParametricType,
  REGULAR_EXPRESSION_TYPE,
  STRING_TYPE,
  TUPLE_TYPE,
  Type,
  TypeConstraints,
  TypeVariable,
  VOID_TYPE,
} from '../types'
import {
  CompileError,
  InternalError,
  MissingBindingError,
  assert,
} from '../errors'
import {
  FileModuleScope,
  IdentifierBinding,
  TypeBinding,
  WalkFileModuleScope,
} from '../symbol_table'
import {
  InferAccessType,
  InferApplicationType,
  InferBranchType,
  InferListType,
  InferMapType,
  InferPatternBindingTypes,
  InferTupleType,
} from './services'
import Parser from 'tree-sitter'
import { isNotUndefined } from '../utilities'

export class InferTypes {
  private _fileScope: FileModuleScope
  private _typeConstraints: TypeConstraints
  private _walkFileModuleScope: WalkFileModuleScope

  // used to communicate type of provided value to when branches
  private caseValueType: Type | undefined

  constructor(fileScope: FileModuleScope) {
    this._fileScope = fileScope
    this._typeConstraints = new TypeConstraints()
    this._walkFileModuleScope = new WalkFileModuleScope(fileScope)
  }

  perform = (): void => {
    assert(
      this._fileScope.tree !== undefined,
      'Syntax tree of file scope should be present.',
    )

    try {
      this.handleProgram(this._fileScope.tree.rootNode)
    } catch (error) {
      if (error instanceof CompileError)
        error.filePath = this._fileScope.filePath
      throw error
    }
  }

  // eslint-disable-next-line max-lines-per-function
  traverse = (node: Parser.SyntaxNode): Type | undefined => {
    try {
      switch (node.type) {
        case 'abstraction':
          return this.handleAbstraction(node)
        case 'abstraction_branch':
          return this.handleAbstractionBranch(node)
        case 'access':
          return this.handleAccess(node)
        case 'application':
          return this.handleApplication(node)
        case 'argument':
          return this.handleArgument(node)
        case 'arguments':
          return this.handleArguments(node)
        case 'assignment':
          return this.handleAssignment(node)
        case 'block':
          return this.handleBlock(node)
        case 'boolean':
          return new ParametricType(BOOLEAN_TYPE)
        case 'case':
          return this.handleCase(node)
        case 'comment':
          return
        case 'escape_sequence':
          return new ParametricType(STRING_TYPE)
        case 'else_if_clause':
          return this.handleElseIfClause(node)
        case 'else_if_clauses':
          return this.handleElseIfClauses(node)
        case 'export':
          return this.handleExport(node)
        case 'expression_pair':
          return this.handleExpressionPair(node)
        case 'generator':
          return this.handleGenerator(node)
        case 'generators':
          return this.handleGenerators(node)
        case 'identifier':
          return this.handleIdentifier(node)
        case 'if':
          return this.handleIf(node)
        case 'import':
          return new ParametricType(VOID_TYPE)
        case 'infix_application':
          return this.handleInfixApplication(node)
        case 'interpolation':
          return this.handleInterpolation(node)
        case 'list':
          return this.handleList(node)
        case 'list_comprehension':
          return this.handleListComprehension(node)
        case 'map':
          return this.handleMap(node)
        case 'module':
          return this.handleModule(node)
        case 'number':
          return new ParametricType(NUMBER_TYPE)
        case 'parameters':
          return this.handleParameters(node)
        case 'pattern_list':
          return this.handlePatternList(node)
        case 'pipeline':
          return this.handlePipeline(node)
        case 'prefix_application':
          return this.handlePrefixApplication(node)
        case 'regex':
          return new ParametricType(REGULAR_EXPRESSION_TYPE)
        case 'return':
          return this.handleReturn(node)
        case 'shorthand_access_identifier':
          return new ParametricType(STRING_TYPE)
        case 'shorthand_pair_identifier':
          return this.handleShorthandPairIdentifier(node)
        case 'spread_list':
          return this.handleSpreadList(node)
        case 'spread_map':
          return this.handleSpreadMap(node)
        case 'spread_tuple':
          return this.handleSpreadTuple(node)
        case 'string':
          return this.handleString(node)
        case 'tuple':
          return this.handleTuple(node)
        case 'type':
          return this.handleType(node)
        case 'when_clause':
          return this.handleWhenClause(node)
        case 'when_clauses':
          return this.handleWhenClauses(node)
        default:
          throw new InternalError(
            `InferTypes: Could not find generator for AST node '${node.type}'.`,
          )
      }
    } catch (error) {
      if (error instanceof CompileError && error.context === undefined)
        error.addContext(node)
      throw error
    }
  }

  private handleAbstraction = (node: Parser.SyntaxNode): Type => {
    const abstractionBranchTypes = node.namedChildren
      .map((child) => this.traverse(child))
      .filter(isNotUndefined)

    return new InferBranchType(this._typeConstraints).perform(
      abstractionBranchTypes,
    )
  }

  private handleAbstractionBranch = (node: Parser.SyntaxNode): CurriedType => {
    this._walkFileModuleScope.peekBlock()
    const parameterTypes = this.handleParameters(node.namedChild(0)!)
    this._walkFileModuleScope.leaveBlock()

    const bodyType = this.handleBlock(node.namedChild(1)!)

    return parameterTypes.concat(bodyType)
  }

  private handleAccess = (node: Parser.SyntaxNode): Type => {
    const valueType = this.traverse(node.namedChild(0)!)!
    const accessorType = this.traverse(node.namedChild(1)!)!

    return new InferAccessType(
      node,
      this._walkFileModuleScope.scope,
      this._typeConstraints,
    ).perform(valueType, accessorType)
  }

  private handleApplication = (node: Parser.SyntaxNode): Type => {
    const valueType = this.traverse(node.namedChild(0)!)!
    const argumentTypes = this.handleArguments(node.namedChild(1)!)

    return new InferApplicationType(this._typeConstraints).perform(
      valueType,
      argumentTypes,
    )
  }

  private handleArgument = (node: Parser.SyntaxNode): Type => {
    if (node.namedChildCount == 0)
      return new TypeVariable(INTERNAL_PARTIAL_APPLICATION_TYPE_NAME)

    return this.traverse(node.namedChild(0)!)!
  }

  private handleArguments = (node: Parser.SyntaxNode): CurriedType => {
    if (node.namedChildCount == 0)
      return new CurriedType([new ParametricType(VOID_TYPE)])

    const argumentTypes = node.namedChildren
      .map((child) => this.traverse(child))
      .filter(isNotUndefined)
    return new CurriedType(argumentTypes)
  }

  private handleAssignment = (node: Parser.SyntaxNode): Type => {
    const patternNode = node.namedChild(0)!
    const valueType = this.traverse(node.namedChild(1)!)!

    return new InferPatternBindingTypes(
      this,
      this._walkFileModuleScope.scope,
      this._typeConstraints,
    ).perform(patternNode, valueType)
  }

  private handleBlock = (node: Parser.SyntaxNode): Type => {
    this._walkFileModuleScope.enterBlock()
    const expressionTypes = node.namedChildren
      .map((child) => this.traverse(child))
      .filter(isNotUndefined)
    this._walkFileModuleScope.leaveBlock()

    return expressionTypes[expressionTypes.length - 1]
  }

  private handleCase = (node: Parser.SyntaxNode): Type => {
    this.caseValueType = this.traverse(node.namedChild(0)!)
    const branchTypes = node.namedChildren
      .slice(1)
      .map((child) => this.traverse(child))
      .filter(isNotUndefined)

    return new InferBranchType(this._typeConstraints).perform(branchTypes)
  }

  private handleElseIfClause = (node: Parser.SyntaxNode): Type => {
    const conditionType = this.traverse(node.namedChild(0)!)!
    const type = this.traverse(node.namedChild(1)!)!

    new ParametricType(BOOLEAN_TYPE).unify(conditionType, this._typeConstraints)

    return type
  }

  private handleElseIfClauses = (node: Parser.SyntaxNode): Type => {
    const branchTypes = node.namedChildren
      .map((child) => this.traverse(child))
      .filter(isNotUndefined)

    return new InferBranchType(this._typeConstraints).perform(branchTypes)
  }

  private handleExport = (node: Parser.SyntaxNode): Type => {
    return this.traverse(node.namedChild(0)!)!
  }

  private handleExpressionPair = (node: Parser.SyntaxNode): ParametricType => {
    const keyType = this.traverse(node.namedChild(0)!)!
    const valueType = this.traverse(node.namedChild(1)!)!

    return new ParametricType(MAP_TYPE, [keyType, valueType])
  }

  // eslint-disable-next-line max-lines-per-function
  private handleGenerator = (node: Parser.SyntaxNode): undefined => {
    const name = node.namedChild(0)!.text
    const valueType = this.traverse(node.namedChild(1)!)!
    const binding = this._walkFileModuleScope.scope.resolveBinding(name, 0)

    assert(
      binding instanceof IdentifierBinding,
      'Generator binding should be found in current scope.',
    )

    const type = new ParametricType(LIST_TYPE, [new TypeVariable()]).unify(
      valueType,
      this._typeConstraints,
    ).parameters[0]
    binding.type = type

    if (node.namedChildCount == 3) {
      const conditionType = this.traverse(node.namedChild(2)!)!

      new ParametricType(BOOLEAN_TYPE).unify(
        conditionType,
        this._typeConstraints,
      )
    }

    return
  }

  private handleGenerators = (node: Parser.SyntaxNode): undefined => {
    node.namedChildren.forEach((child) => this.traverse(child))

    return
  }

  private handleIdentifier = (node: Parser.SyntaxNode): Type => {
    const name = node.text
    const binding = this._walkFileModuleScope.scope.resolveBinding(name)

    assert(
      binding instanceof IdentifierBinding,
      'Identifier binding should be found in scope.',
    )

    return binding.type
  }

  private handleIf = (node: Parser.SyntaxNode): Type => {
    const [conditionType, ...branchTypes] = node.namedChildren
      .map((child) => this.traverse(child))
      .filter(isNotUndefined)

    new ParametricType(BOOLEAN_TYPE).unify(conditionType, this._typeConstraints)

    return new InferBranchType(this._typeConstraints).perform(branchTypes)
  }

  private handleInfixApplication = (node: Parser.SyntaxNode): Type => {
    const leftType = this.traverse(node.namedChild(0)!)!
    const valueType = this.traverse(node.namedChild(1)!)!
    const rightType = this.traverse(node.namedChild(2)!)!
    const argumentTypes = new CurriedType([leftType, rightType])

    return new InferApplicationType(this._typeConstraints).perform(
      valueType,
      argumentTypes,
    )
  }

  private handleInterpolation = (node: Parser.SyntaxNode): Type => {
    const type = this.traverse(node.namedChild(0)!)!

    return new ParametricType(STRING_TYPE).unify(type, this._typeConstraints)
  }

  private handleList = (node: Parser.SyntaxNode): ParametricType => {
    return new InferListType(this, this._typeConstraints).perform(
      node.namedChildren,
    )
  }

  private handleListComprehension = (
    node: Parser.SyntaxNode,
  ): ParametricType => {
    this._walkFileModuleScope.peekBlock()
    this.handleGenerators(node.namedChild(1)!)
    this._walkFileModuleScope.leaveBlock()

    const bodyType = this.traverse(node.namedChild(0)!)!

    return new ParametricType(LIST_TYPE, [bodyType])
  }

  private handleMap = (node: Parser.SyntaxNode): ParametricType => {
    const mapTypes = node.namedChildren
      .map((child) => this.traverse(child))
      .filter(isNotUndefined)

    return new InferMapType(this._typeConstraints).perform(mapTypes)
  }

  private handleModule = (node: Parser.SyntaxNode): ParametricType => {
    const type = new BuildType().handleType(node.namedChild(0)!)

    this.traverse(node.namedChild(1)!)

    return type
  }

  private handleParameters = (node: Parser.SyntaxNode): CurriedType => {
    if (node.namedChildCount == 0)
      return new CurriedType([new ParametricType(VOID_TYPE)])

    const parameterTypes = new InferPatternBindingTypes(
      this,
      this._walkFileModuleScope.scope,
      this._typeConstraints,
    ).perform(node)
    assert(parameterTypes instanceof ParametricType, 'Should be tuple type.')

    return new CurriedType(parameterTypes.parameters)
  }

  private handlePatternList = (node: Parser.SyntaxNode): undefined => {
    node.namedChildren.forEach((patternNode) => {
      new InferPatternBindingTypes(
        this,
        this._walkFileModuleScope.scope,
        this._typeConstraints,
      ).perform(patternNode, this.caseValueType!)
    })

    return
  }

  private handlePipeline = (node: Parser.SyntaxNode): Type => {
    const argumentType = this.traverse(node.namedChild(0)!)!
    const valueType = this.traverse(node.namedChild(1)!)!
    const argumentTypes = new CurriedType([argumentType])

    return new InferApplicationType(this._typeConstraints).perform(
      valueType,
      argumentTypes,
    )
  }

  private handlePrefixApplication = (node: Parser.SyntaxNode): Type => {
    const valueType = this.traverse(node.namedChild(0)!)!
    const argumentType = this.traverse(node.namedChild(1)!)!
    const argumentTypes = new CurriedType([argumentType])

    return new InferApplicationType(this._typeConstraints).perform(
      valueType,
      argumentTypes,
    )
  }

  private handleProgram = (node: Parser.SyntaxNode): void => {
    node.namedChildren.forEach((child) => this.traverse(child))
  }

  private handleReturn = (node: Parser.SyntaxNode): Type =>
    this.traverse(node.namedChild(0)!)!

  private handleShorthandPairIdentifier = (
    node: Parser.SyntaxNode,
  ): ParametricType => {
    const name = node.text
    const binding = this._walkFileModuleScope.scope.resolveBinding(name)

    assert(
      binding instanceof IdentifierBinding,
      'Identifier binding should be found in scope.',
    )

    const keyType = new ParametricType(STRING_TYPE)
    const valueType = binding.type

    return new ParametricType(MAP_TYPE, [keyType, valueType])
  }

  private handleSpreadList = (node: Parser.SyntaxNode): Type => {
    const valueType = this.traverse(node.namedChild(0)!)!

    return new ParametricType(LIST_TYPE).unify(
      valueType,
      this._typeConstraints,
      true,
    )
  }

  private handleSpreadMap = (node: Parser.SyntaxNode): Type => {
    const valueType = this.traverse(node.namedChild(0)!)!

    return new ParametricType(MAP_TYPE, []).unify(
      valueType,
      this._typeConstraints,
      true,
    )
  }

  private handleSpreadTuple = (node: Parser.SyntaxNode): Type => {
    const valueType = this.traverse(node.namedChild(0)!)!

    return new ParametricType(TUPLE_TYPE, []).unify(
      valueType,
      this._typeConstraints,
      true,
    )
  }

  private handleString = (node: Parser.SyntaxNode): ParametricType => {
    node.namedChildren.forEach((child) => this.traverse(child))

    return new ParametricType(STRING_TYPE)
  }

  private handleTuple = (node: Parser.SyntaxNode): ParametricType => {
    return new InferTupleType(this, this._typeConstraints).perform(
      node.namedChildren,
    )
  }

  private handleType = (node: Parser.SyntaxNode): Type => {
    const name = node.text
    const binding = this._walkFileModuleScope.scope.resolveBinding(name)

    if (binding instanceof TypeBinding) return binding.type
    else throw new MissingBindingError(name)
  }

  private handleWhenClause = (node: Parser.SyntaxNode): Type => {
    this._walkFileModuleScope.peekBlock()
    this.handlePatternList(node.namedChild(0)!)
    this._walkFileModuleScope.leaveBlock()

    return this.traverse(node.namedChild(1)!)!
  }

  private handleWhenClauses = (node: Parser.SyntaxNode): Type => {
    const branchTypes = node.namedChildren
      .map((child) => this.traverse(child))
      .filter(isNotUndefined)

    return new InferBranchType(this._typeConstraints).perform(branchTypes)
  }
}
