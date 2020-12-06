import * as AST from '../ast'
import {
  AccumulateTypeDisjunction,
  DistributeTypeDisjunction,
  GetModuleTypeRepresentation,
  InferAbstractionBranchType,
  InferAccessType,
  InferApplicationType,
  InferAssignmentType,
  InferBlockType,
  InferBranchType,
  InferExpressionPairType,
  InferGeneratorType,
  InferImportBindingTypes,
  InferListType,
  InferMapType,
  InferPatternBindingTypes,
  InferStringType,
  InferTupleType,
  MergeAccumulatedTypeDisjunction,
  MergeTypeDisjunction,
} from './services'
import {
  AccumulatedAnswer,
  AccumulatedDisjunction,
  Answer,
  Disjunction,
  GeneralizedDisjunction,
} from './models'
import {
  BOOLEAN_TYPE,
  BuildType,
  FUNCTION_TYPE,
  LIST_TYPE,
  MAP_TYPE,
  NUMBER_TYPE,
  ParametricType,
  REGULAR_EXPRESSION_TYPE,
  STRING_TYPE,
  TUPLE_TYPE,
  TypeConstraint,
  TypeEqualityGraph,
  VOID_TYPE,
} from '../types'
import {
  CompileError,
  IndeterminateTypeError,
  InternalError,
  TypeError,
  assert,
} from '../errors'
import {
  FileModuleScope,
  IdentifierBinding,
  IdentifierBindingTemplate,
  WalkFileModuleScope,
} from '../symbol_table'
import Parser from 'tree-sitter'
import { isNotUndefined } from '../utilities'

export class InferTypes {
  private _fileScope: FileModuleScope
  private _walkFileModuleScope: WalkFileModuleScope

  constructor(fileScope: FileModuleScope) {
    this._fileScope = fileScope
    this._walkFileModuleScope = new WalkFileModuleScope(fileScope)
  }

  perform = (): AST.Program => {
    assert(
      this._fileScope.tree !== undefined,
      'Syntax tree of file scope should be present.',
    )

    try {
      return CompileError.addContext(
        this.chooseAnswer,
        this._fileScope.tree.rootNode,
      )
    } catch (error) {
      if (error instanceof CompileError)
        error.filePath = this._fileScope.filePath
      throw error
    }
  }

  chooseAnswer = (node: Parser.SyntaxNode): AST.Program => {
    const answers = CompileError.addContext(this.handleProgram, node)
    console.log(
      this._walkFileModuleScope.scope
        .resolveBinding('quicksort')
        .typeConstraint.toString(),
    )

    return answers.answers.reduce((acc, answer) => {
      const unifiedTypeConstraint = acc.typeConstraint.unify(
        answer.typeConstraint,
      )
      if (unifiedTypeConstraint === undefined)
        throw new IndeterminateTypeError(
          answers.answers.map((answer) => answer.typeConstraint.toString()),
        )

      return new Answer(acc.node, unifiedTypeConstraint)
    }).node
  }

  // eslint-disable-next-line max-lines-per-function
  traverse = (node: Parser.SyntaxNode): Disjunction<AST.SyntaxNode> => {
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
      case 'assignment':
        return this.handleAssignment(node)
      case 'block':
        return this.handleBlock(node)
      case 'boolean':
        return this.handleBoolean(node)
      case 'case':
        return this.handleCase(node)
      case 'else_if':
        return this.handleElseIf(node)
      case 'export':
        return this.handleExport(node)
      case 'expression_pair':
        return this.handleExpressionPair(node)
      case 'generator':
        return this.handleGenerator(node)
      case 'identifier':
        return this.handleIdentifier(node)
      case 'if':
        return this.handleIf(node)
      case 'import':
        return this.handleImport(node)
      case 'infix_application':
        return this.handleInfixApplication(node)
      case 'list':
        return this.handleList(node)
      case 'list_comprehension':
        return this.handleListComprehension(node)
      case 'map':
        return this.handleMap(node)
      case 'module':
        return this.handleModule(node)
      case 'number':
        return this.handleNumber(node)
      case 'parameters':
        return this.handleParameters(node)
      case 'pipeline':
        return this.handlePipeline(node)
      case 'prefix_application':
        return this.handlePrefixApplication(node)
      case 'regex':
        return this.handleRegex(node)
      case 'return':
        return this.handleReturn(node)
      case 'shorthand_access_identifier':
        return this.handleShorthandAccessIdentifier(node)
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
      default:
        throw new InternalError(
          `Could not find generator for AST node '${node.type}'.`,
        )
    }
  }

  private handleAbstraction = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.Abstraction> => {
    const abstractionBranches = node.namedChildren.map((child) =>
      CompileError.addContext(this.handleAbstractionBranch, child),
    )

    return new InferBranchType<AST.AbstractionBranch, AST.Abstraction>(
      (branches) => new AST.Abstraction(branches),
    ).perform(abstractionBranches)
  }

  private handleAbstractionBranch = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.AbstractionBranch> => {
    this._walkFileModuleScope.peekBlock()
    const parameters = CompileError.addContext(
      this.handleParameters,
      node.namedChild(0)!,
    )
    this._walkFileModuleScope.leaveBlock()

    const body = CompileError.addContext(this.handleBlock, node.namedChild(1)!)

    return new InferAbstractionBranchType().perform(parameters, body)
  }

  private handleAccess = (node: Parser.SyntaxNode): Disjunction<AST.Access> => {
    const value = CompileError.addContext(this.traverse, node.namedChild(0)!)!
    const accessor = CompileError.addContext(
      this.traverse,
      node.namedChild(1)!,
    )!

    return new InferAccessType(
      new GetModuleTypeRepresentation(this._walkFileModuleScope.scope),
    ).perform(value, accessor)
  }

  private handleApplication = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.Application> => {
    const value = CompileError.addContext(this.traverse, node.namedChild(0)!)!
    const args = CompileError.addContext(
      this.handleArguments,
      node.namedChild(1)!,
    )

    return new InferApplicationType<
      AST.Expression,
      AST.Argument,
      AST.Application
    >(
      (valueNode, argumentNodes, typeConstraint) =>
        new Answer(
          new AST.Application(valueNode, argumentNodes),
          typeConstraint,
        ),
    ).perform(value, args)
  }

  private handleArgument = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.Argument> => {
    if (node.namedChildCount == 0)
      return new Disjunction([
        new Answer(
          new AST.Argument(),
          new TypeConstraint(new ParametricType(VOID_TYPE)),
        ),
      ])

    const value = CompileError.addContext(this.traverse, node.namedChild(0)!)!
    return new Disjunction(
      value.answers.map(
        (answer) =>
          new Answer(new AST.Argument(answer.node), answer.typeConstraint),
      ),
    )
  }

  private handleArguments = (
    node: Parser.SyntaxNode,
  ): AccumulatedDisjunction<AST.Argument> => {
    if (node.namedChildCount == 0) return [new AccumulatedAnswer()]

    const args = node.namedChildren.map((child) =>
      CompileError.addContext(this.handleArgument, child),
    )
    return new DistributeTypeDisjunction<AST.Argument>().perform(args)
  }

  private handleAssignment = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.Assignment> => {
    const patternNode = node.namedChild(0)!
    const value = CompileError.addContext(this.traverse, node.namedChild(1)!)!

    return new InferAssignmentType(
      new InferPatternBindingTypes(this, this._walkFileModuleScope.scope),
    ).perform(patternNode, value)
  }

  private handleBlock = (node: Parser.SyntaxNode): Disjunction<AST.Block> => {
    this._walkFileModuleScope.enterBlock()
    const expressions = node.namedChildren.map((child) =>
      CompileError.addContext(this.traverse, child),
    )
    this._walkFileModuleScope.leaveBlock()

    return new InferBlockType<AST.Block>(
      (expressions) => new AST.Block(expressions.nodes),
    ).perform(expressions)
  }

  private handleBoolean = (node: Parser.SyntaxNode): Disjunction<AST.Boolean> =>
    new Disjunction([
      new Answer(
        new AST.Boolean(node.text),
        new TypeConstraint(new ParametricType(BOOLEAN_TYPE)),
      ),
    ])

  // eslint-disable-next-line max-lines-per-function
  private handleCase = (node: Parser.SyntaxNode): Disjunction<AST.Case> => {
    const value = CompileError.addContext(this.traverse, node.namedChild(0)!)
    let branches: GeneralizedDisjunction<AST.SyntaxNode>[] = []
    if (node.namedChildCount == 3)
      branches = [
        ...branches,
        CompileError.addContext(this.handleBlock, node.namedChild(2)!),
      ]

    return new Disjunction(
      value.answers
        .map((valueAnswer) => {
          branches = [
            ...branches,
            CompileError.addContext(
              this.handleWhenClauses,
              node.namedChild(1)!,
              valueAnswer,
            ),
          ]

          return new InferBranchType((branches) => {
            const whens = branches.filter(
              (node) => node instanceof AST.When,
            ) as AST.When[]
            const [els] = branches.filter(
              (node) => node instanceof AST.Block,
            ) as AST.Block[]

            return new AST.Case(valueAnswer.node, whens, els)
          }).perform(branches).answers
        })
        .flat(1),
    )
  }

  // eslint-disable-next-line max-lines-per-function
  private handleElseIf = (node: Parser.SyntaxNode): Disjunction<AST.ElseIf> => {
    const condition = CompileError.addContext(
      this.traverse,
      node.namedChild(0)!,
    )
    const body = CompileError.addContext(this.handleBlock, node.namedChild(1)!)

    return new MergeTypeDisjunction<AST.SyntaxNode, AST.Block, AST.ElseIf>(
      (condition, body) => {
        const unifiedConditionTypeConstraint = new TypeConstraint(
          new ParametricType(BOOLEAN_TYPE),
        ).unify(condition.typeConstraint)
        if (unifiedConditionTypeConstraint === undefined) return

        return new Answer(
          new AST.ElseIf(condition.node, body.node),
          new TypeConstraint(
            body.typeConstraint.type,
            TypeEqualityGraph.build(
              unifiedConditionTypeConstraint.typeEqualityGraph,
              body.typeConstraint.typeEqualityGraph,
            ),
          ),
        )
      },
    ).perform(condition, body)
  }

  private handleElseIfClauses = (
    node: Parser.SyntaxNode,
  ): AccumulatedDisjunction<AST.ElseIf> => {
    const branches = node.namedChildren.map((child) =>
      CompileError.addContext(this.handleElseIf, child),
    )

    return new DistributeTypeDisjunction<AST.ElseIf>().perform(branches)
  }

  private handleExport = (node: Parser.SyntaxNode): Disjunction<AST.Export> => {
    const declaration = CompileError.addContext(
      this.traverse,
      node.namedChild(0)!,
    )!

    return new Disjunction(
      declaration.answers.map(
        (answer) =>
          new Answer(
            new AST.Export(answer.node as AST.Declaration),
            answer.typeConstraint,
          ),
      ),
    )
  }

  private handleExpressionPair = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.ExpressionPair> => {
    const key = CompileError.addContext(this.traverse, node.namedChild(0)!)!
    const value = CompileError.addContext(this.traverse, node.namedChild(1)!)!

    return new InferExpressionPairType().perform(key, value)
  }

  private handleGenerator = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.Generator> => {
    const value = CompileError.addContext(this.traverse, node.namedChild(1)!)
    const condition =
      node.namedChildCount == 3
        ? CompileError.addContext(this.traverse, node.namedChild(2)!)
        : undefined
    const bindingTemplate = this._walkFileModuleScope.scope.bindingTemplates.find(
      (bindingTemplate) => bindingTemplate.node === node,
    )

    assert(
      bindingTemplate instanceof IdentifierBindingTemplate,
      'Generator binding should be found in current scope.',
    )

    return new InferGeneratorType(this._walkFileModuleScope.scope).perform(
      bindingTemplate,
      value,
      condition,
    )
  }

  private handleGenerators = (
    node: Parser.SyntaxNode,
  ): AccumulatedDisjunction<AST.Generator> => {
    const generators = node.namedChildren.map((child) =>
      CompileError.addContext(this.handleGenerator, child),
    )

    return new DistributeTypeDisjunction<AST.Generator>().perform(generators)
  }

  private handleIdentifier = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.Identifier> => {
    const name = node.text
    const bindings = this._walkFileModuleScope.scope.resolveBindings(name)

    return new Disjunction(
      bindings.map((binding) => {
        assert(
          binding instanceof IdentifierBinding ||
            binding instanceof IdentifierBindingTemplate,
          'Binding should be an identifier binding.',
        )

        return new Answer(
          new AST.Identifier(
            binding.typeConstraint.type,
            binding.name,
            binding.transformedName,
          ),
          binding.typeConstraint,
        )
      }),
    )
  }

  // eslint-disable-next-line max-lines-per-function
  private handleIf = (node: Parser.SyntaxNode): Disjunction<AST.If> => {
    const condition = CompileError.addContext(
      this.traverse,
      node.namedChild(0)!,
    )
    let branches: GeneralizedDisjunction<AST.SyntaxNode>[] = [
      CompileError.addContext(this.handleBlock, node.namedChild(1)!),
    ]
    if (node.namedChildCount >= 3)
      if (node.namedChild(2)!.type === 'block')
        branches = [
          ...branches,
          CompileError.addContext(this.handleBlock, node.namedChild(2)!),
        ]
      else
        branches = [
          ...branches,
          CompileError.addContext(
            this.handleElseIfClauses,
            node.namedChild(2)!,
          ),
        ]
    if (node.namedChildCount >= 4)
      branches = [
        ...branches,
        CompileError.addContext(this.handleBlock, node.namedChild(3)!),
      ]

    return new Disjunction(
      condition.answers
        .map((conditionAnswer) => {
          return new InferBranchType((branches) => {
            const [body, els] = branches.filter(
              (node) => node instanceof AST.Block,
            ) as (AST.Block | undefined)[]
            const elseIfs = branches.filter(
              (node) => node instanceof AST.ElseIf,
            ) as AST.ElseIf[]

            assert(body !== undefined, 'Body node should be given.')

            return new AST.If(conditionAnswer.node, body, elseIfs, els)
          }).perform(branches).answers
        })
        .flat(1),
    )
  }

  private handleImport = (node: Parser.SyntaxNode): Disjunction<AST.Import> => {
    const typeEqualityGraph = new TypeEqualityGraph()

    new InferImportBindingTypes(
      this._fileScope,
      this._fileScope.parentScope.scopes,
      typeEqualityGraph,
    ).perform(node)

    return new Disjunction([
      new Answer(
        new AST.Import(),
        new TypeConstraint(new ParametricType(VOID_TYPE), typeEqualityGraph),
      ),
    ])
  }

  // eslint-disable-next-line max-lines-per-function
  private handleInfixApplication = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.InfixApplication> => {
    const left = CompileError.addContext(this.traverse, node.namedChild(0)!)!
    const value = CompileError.addContext(
      this.handleIdentifier,
      node.namedChild(1)!,
    )!
    const right = CompileError.addContext(this.traverse, node.namedChild(2)!)!
    const args = new AccumulateTypeDisjunction<AST.Expression>(
      (left, right) => new AccumulatedAnswer([left, right]),
    ).perform(left, right)

    return new InferApplicationType<
      AST.Identifier,
      AST.Expression,
      AST.InfixApplication
    >(
      (valueNode, argumentNodes, typeConstraint) =>
        new Answer(
          new AST.InfixApplication(
            argumentNodes[0],
            valueNode,
            argumentNodes[1],
          ),
          typeConstraint,
        ),
    ).perform(value, args)
  }

  private handleList = (node: Parser.SyntaxNode): Disjunction<AST.List> => {
    const elements = node.namedChildren.map((child) =>
      CompileError.addContext(this.traverse, child),
    )

    return new InferListType((elements) => new AST.List(elements)).perform(
      elements,
    )
  }

  // eslint-disable-next-line max-lines-per-function
  private handleListComprehension = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.ListComprehension> => {
    this._walkFileModuleScope.peekBlock()
    const generators = CompileError.addContext(
      this.handleGenerators,
      node.namedChild(1)!,
    )
    this._walkFileModuleScope.leaveBlock()

    const body = this.handleBlock(node.namedChild(0)!)!

    return new MergeAccumulatedTypeDisjunction<
      AST.Generator,
      AST.Block,
      AST.ListComprehension
    >(
      (generators, body) =>
        new Answer(
          new AST.ListComprehension(body.node, generators.nodes),
          new TypeConstraint(
            new ParametricType(LIST_TYPE, [body.typeConstraint.type]),
            TypeEqualityGraph.build(
              body.typeConstraint.typeEqualityGraph,
              ...generators.typeConstraints.map(
                (typeConstraint) => typeConstraint.typeEqualityGraph,
              ),
            ),
          ),
        ),
    ).perform(generators, body)
  }

  private handleMap = (node: Parser.SyntaxNode): Disjunction<AST.Map> => {
    const elements = node.namedChildren.map((child) =>
      CompileError.addContext(this.traverse, child),
    )

    return new InferMapType(
      (elements) => new AST.Map(elements as AST.MapElement[]),
    ).perform(elements)
  }

  private handleModule = (node: Parser.SyntaxNode): Disjunction<AST.Module> => {
    const type = new BuildType().perform(node.namedChild(0)!)
    const representation = new GetModuleTypeRepresentation(
      this._walkFileModuleScope.scope,
    ).perform(type)
    const body = CompileError.addContext(this.handleBlock, node.namedChild(1)!)

    return new Disjunction(
      body.answers.map(
        (answer) =>
          new Answer(
            new AST.Module(type.name, answer.node),
            new TypeConstraint(
              representation,
              answer.typeConstraint.typeEqualityGraph,
            ),
          ),
      ),
    )
  }

  private handleNumber = (node: Parser.SyntaxNode): Disjunction<AST.Number> =>
    new Disjunction([
      new Answer(
        new AST.Number(node.text),
        new TypeConstraint(new ParametricType(NUMBER_TYPE)),
      ),
    ])

  // eslint-disable-next-line max-lines-per-function
  private handleParameters = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.Parameters> => {
    if (node.namedChildCount == 0)
      return new Disjunction([
        new Answer(
          new AST.Parameters(),
          new TypeConstraint(
            new ParametricType(FUNCTION_TYPE, [new ParametricType(VOID_TYPE)]),
          ),
        ),
      ])

    const parameters = new InferPatternBindingTypes(
      this,
      this._walkFileModuleScope.scope,
    )
      .perform(node)
      ?.answers.map((answer) => {
        assert(
          answer.node instanceof AST.TuplePattern,
          'Should be a tuple pattern.',
        )

        return new Answer(
          new AST.Parameters(answer.node.elements),
          answer.typeConstraint,
        )
      })
    if (parameters === undefined) throw new TypeError()

    return new Disjunction(parameters)
  }

  private handlePatternList = (
    node: Parser.SyntaxNode,
    value: Answer<AST.Expression>,
  ): AccumulatedDisjunction<AST.Pattern> => {
    const patterns = node.namedChildren
      .map((patternNode) =>
        new InferPatternBindingTypes(
          this,
          this._walkFileModuleScope.scope,
        ).perform(patternNode, value.typeConstraint),
      )
      .filter(isNotUndefined)

    return new DistributeTypeDisjunction<AST.Pattern>().perform(patterns)
  }

  // eslint-disable-next-line max-lines-per-function
  private handlePipeline = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.Pipeline> => {
    const argument = CompileError.addContext(
      this.traverse,
      node.namedChild(0)!,
    )!
    const value = CompileError.addContext(this.traverse, node.namedChild(1)!)!
    const args = argument.answers.map(
      (answer) => new AccumulatedAnswer([answer]),
    )

    return new InferApplicationType<
      AST.Expression,
      AST.Expression,
      AST.Pipeline
    >(
      (valueNode, argumentNodes, typeConstraint) =>
        new Answer(
          new AST.Pipeline(valueNode, argumentNodes[0]),
          typeConstraint,
        ),
    ).perform(value, args)
  }

  // eslint-disable-next-line max-lines-per-function
  private handlePrefixApplication = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.PrefixApplication> => {
    const value = CompileError.addContext(
      this.handleIdentifier,
      node.namedChild(0)!,
    )!
    const argument = CompileError.addContext(
      this.traverse,
      node.namedChild(1)!,
    )!
    const args = argument.answers.map(
      (answer) => new AccumulatedAnswer([answer]),
    )

    return new InferApplicationType<
      AST.Identifier,
      AST.Expression,
      AST.PrefixApplication
    >(
      (valueNode, argumentNodes, typeConstraint) =>
        new Answer(
          new AST.PrefixApplication(valueNode, argumentNodes[0]),
          typeConstraint,
        ),
    ).perform(value, args)
  }

  private handleProgram = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.Program> => {
    const expressions = node.namedChildren.map((child) =>
      CompileError.addContext(this.traverse, child),
    )

    return new InferBlockType<AST.Program>(
      (expressions) => new AST.Program(expressions.nodes),
    ).perform(expressions)
  }

  private handleRegex = (node: Parser.SyntaxNode): Disjunction<AST.Regex> =>
    new Disjunction([
      new Answer(
        new AST.Regex(node.text),
        new TypeConstraint(new ParametricType(REGULAR_EXPRESSION_TYPE)),
      ),
    ])

  private handleReturn = (node: Parser.SyntaxNode): Disjunction<AST.Return> => {
    const value = CompileError.addContext(this.traverse, node.namedChild(0)!)!

    return new Disjunction(
      value.answers.map(
        (answer) =>
          new Answer(new AST.Return(answer.node), answer.typeConstraint),
      ),
    )
  }

  private handleShorthandAccessIdentifier = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.ShorthandAccessIdentifier> => {
    const name = node.text
    const shorthandAccessIdentifier = new AST.ShorthandAccessIdentifier(name)

    return new Disjunction([
      new Answer(
        shorthandAccessIdentifier,
        new TypeConstraint(new ParametricType(STRING_TYPE)),
      ),
    ])
  }

  // eslint-disable-next-line max-lines-per-function
  private handleShorthandPairIdentifier = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.ShorthandPairIdentifier> => {
    const name = node.text
    const bindings = this._walkFileModuleScope.scope.resolveBindings(name)
    const keyType = new ParametricType(STRING_TYPE)

    return new Disjunction(
      bindings.map((binding) => {
        assert(
          binding instanceof IdentifierBinding ||
            binding instanceof IdentifierBindingTemplate,
          'Binding should be an identifier binding.',
        )

        return new Answer(
          new AST.ShorthandPairIdentifier(
            binding.name,
            binding.transformedName,
          ),
          new TypeConstraint(
            new ParametricType(MAP_TYPE, [
              keyType,
              binding.typeConstraint.type,
            ]),
            binding.typeConstraint.typeEqualityGraph,
          ),
        )
      }),
    )
  }

  private handleSpreadList = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.SpreadList> => {
    const value = CompileError.addContext(this.traverse, node.namedChild(0)!)!

    return new Disjunction(
      value.answers.map((answer) => {
        const typeConstraint = new TypeConstraint(
          new ParametricType(LIST_TYPE, []),
        ).unify(answer.typeConstraint, true)
        if (typeConstraint === undefined) return

        return new Answer(new AST.SpreadList(answer.node), typeConstraint)
      }),
    )
  }

  private handleSpreadMap = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.SpreadMap> => {
    const value = CompileError.addContext(this.traverse, node.namedChild(0)!)!

    return new Disjunction(
      value.answers.map((answer) => {
        const typeConstraint = new TypeConstraint(
          new ParametricType(MAP_TYPE, []),
        ).unify(answer.typeConstraint, true)
        if (typeConstraint === undefined) return

        return new Answer(new AST.SpreadMap(answer.node), typeConstraint)
      }),
    )
  }

  private handleSpreadTuple = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.SpreadTuple> => {
    const value = CompileError.addContext(this.traverse, node.namedChild(0)!)!

    return new Disjunction(
      value.answers.map((answer) => {
        const typeConstraint = new TypeConstraint(
          new ParametricType(TUPLE_TYPE, []),
        ).unify(answer.typeConstraint, true)
        if (typeConstraint === undefined) return

        return new Answer(new AST.SpreadTuple(answer.node), typeConstraint)
      }),
    )
  }

  private handleString = (node: Parser.SyntaxNode): Disjunction<AST.String> => {
    const content = node.text.slice(1, -1)
    const interpolationValues = node.namedChildren.map((child) =>
      CompileError.addContext(this.traverse, child.namedChild(0)!),
    )

    return new InferStringType().perform(content, interpolationValues)
  }

  private handleTuple = (node: Parser.SyntaxNode): Disjunction<AST.Tuple> => {
    const elements = node.namedChildren.map((child) =>
      CompileError.addContext(this.traverse, child),
    )

    return new InferTupleType((elements) => new AST.Tuple(elements)).perform(
      elements,
    )
  }

  private handleType = (
    node: Parser.SyntaxNode,
  ): Disjunction<AST.ParametricType> => {
    const type = new BuildType().perform(node)

    return new Disjunction([
      new Answer(
        new AST.ParametricType(type.name),
        new TypeConstraint(
          new GetModuleTypeRepresentation(
            this._walkFileModuleScope.scope,
          ).perform(type),
        ),
      ),
    ])
  }

  // eslint-disable-next-line max-lines-per-function
  private handleWhen = (
    node: Parser.SyntaxNode,
    value: Answer<AST.Expression>,
  ): Disjunction<AST.When> => {
    this._walkFileModuleScope.peekBlock()
    const patterns = this.handlePatternList(node.namedChild(0)!, value)
    this._walkFileModuleScope.leaveBlock()

    const body = this.handleBlock(node.namedChild(1)!)!

    return new MergeAccumulatedTypeDisjunction<
      AST.Pattern,
      AST.Block,
      AST.When
    >(
      (patterns, body) =>
        new Answer(
          new AST.When(patterns.nodes, body.node),
          new TypeConstraint(
            body.typeConstraint.type,
            TypeEqualityGraph.build(
              ...patterns.typeConstraints.map(
                (typeConstraint) => typeConstraint.typeEqualityGraph,
              ),
              body.typeConstraint.typeEqualityGraph,
            ),
          ),
        ),
    ).perform(patterns, body)
  }

  private handleWhenClauses = (
    node: Parser.SyntaxNode,
    value: Answer<AST.Expression>,
  ): AccumulatedDisjunction<AST.When> => {
    const branches = node.namedChildren.map((child) =>
      CompileError.addContext(this.handleWhen, child, value),
    )

    return new DistributeTypeDisjunction<AST.When>().perform(branches)
  }
}
