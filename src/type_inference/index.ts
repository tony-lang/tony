import { Answer, Answers, buildAnswer } from '../types/type_inference/answers'
import {
  BOOLEAN_TYPE,
  NUMBER_TYPE,
  PrimitiveType,
  REG_EXP_TYPE,
  STRING_TYPE,
  VOID_TYPE,
} from '../types/type_inference/primitive_types'
import {
  Constraints,
  buildConstraints,
} from '../types/type_inference/constraints'
import { ErrorNode, ProgramNode, SyntaxType } from 'tree-sitter-tony/tony'
import {
  FileScope,
  GlobalScope,
  NestedScope,
  NestingTermLevelNode,
  TypedFileScope,
  TypedNestedScope,
  buildTypedFileScope,
  buildTypedNestedScope,
  isFileScope,
} from '../types/analyze/scopes'
import { LogLevel, log } from '../logger'
import { NotImplementedError, assert } from '../types/errors/internal'
import {
  TypedNode,
  TypedNodeChildren,
  TypedNodeExtensions,
  buildTypedNode,
} from '../types/type_inference/nodes'
import { addErrorUnless, traverseScopes } from '../util/traverse'
import { filterFileScopeByTermScopes, findScopeOfNode } from '../util/scopes'
import { mapAnswers, reduceAnswers } from '../util/answers'
import { Config } from '../config'
import { Dependency } from '../types/analyze/dependencies'
import { NonTypeLevelNode } from '../types/nodes'
import { ResolvedType } from '../types/type_inference/categories'
import { TypeAssignment } from '../types/analyze/bindings'
import { buildAmbiguousTypeError } from '../types/errors/annotations'
import { buildTemporaryTypeVariable } from '../types/type_inference/types'
import { isInstanceOf } from './instances'
import { unifyConstraints } from './constraints'

type State<T extends Dependency = Dependency> = {
  /**
   * A list of file scopes that are already typed.
   */
  typedFileScopes: TypedFileScope[]
  /**
   * A stack of all scopes starting with the closest scope and ending with the
   * symbol table.
   */
  scopes: (
    | FileScope<T, NestingTermLevelNode>
    | NestedScope<NestingTermLevelNode>
  )[]
  /**
   * A list of type assignments for each scope on the scope stack.
   */
  typeAssignments: TypeAssignment[][]
  /**
   * A list of already visited and typed direct child scopes for each scope on
   * the scope stack.
   */
  typedScopes: TypedNestedScope[][]
}

/**
 * Represents a type annotation (an "explanation") for a given node in the
 * syntax tree.
 */
type Return<T extends NonTypeLevelNode = NonTypeLevelNode> = {
  typedNode: TypedNode<T>
}

/**
 * Represents the contextual type of a node in the syntax tree.
 */
type Context = { type: ResolvedType; constraints: Constraints }

export const inferTypes = (
  config: Config,
  globalScope: GlobalScope<FileScope>,
): GlobalScope<TypedFileScope> => {
  log(config, LogLevel.Info, 'Running type inference')

  const typedFileScopes = globalScope.scopes.reduce<TypedFileScope[]>(
    (acc, fileScope) => [...acc, inferTypesOfFile(acc, fileScope)],
    [],
  )

  return {
    ...globalScope,
    scopes: typedFileScopes,
  }
}

const inferTypesOfFile = (
  typedFileScopes: TypedFileScope[],
  fileScope: FileScope,
): TypedFileScope => {
  const initialState: State = {
    typedFileScopes,
    scopes: [filterFileScopeByTermScopes(fileScope)],
    typeAssignments: [[]],
    typedScopes: [],
  }
  const answers = handleProgram(initialState, fileScope.node)
  const [answer] = answers
  const {
    scopes: [finalFileScope],
    typeAssignments: [finalTypeAssignments],
    typedScopes: [finalTypedScopes],
  } = addErrorUnless<State>(
    answers.length === 1,
    buildAmbiguousTypeError(answers.map((answer) => answer.typedNode)),
  )(answer.state, fileScope.node)
  assert(
    isFileScope(finalFileScope),
    'Traverse should arrive at the top-level file scope.',
  )

  return buildTypedFileScope(
    finalFileScope,
    finalTypedScopes,
    answer.typedNode,
    finalTypeAssignments,
  )
}

const buildContext = (
  type: ResolvedType = buildTemporaryTypeVariable(),
  constraints: Constraints = buildConstraints(),
): Context => ({ type, constraints })

const buildPrimitiveAnswer = <T extends NonTypeLevelNode>(
  state: State,
  node: T,
  type: PrimitiveType,
  childNodes: TypedNodeChildren<T>,
  extensions: TypedNodeExtensions<T>,
): Answer<State, Return<T>> =>
  buildAnswer(state, {
    typedNode: buildTypedNode(
      node,
      type,
      buildConstraints(),
      childNodes,
      extensions,
    ),
  })

const wrapAnswer = <T extends NonTypeLevelNode, U extends NonTypeLevelNode>(
  answer: Answer<State, { results: Return<U>[] }>,
  callback: (
    state: State,
    typedNodes: TypedNode<U>[],
    constraints: Constraints,
  ) => Answers<State, Return<T>>,
): Answers<State, Return<T>> =>
  mapAnswers(
    unifyConstraints(
      answer.state,
      ...answer.results.map((result) => result.typedNode.constraints),
    ),
    ({ state, constraints }) =>
      callback(
        state,
        answer.results.map((result) => result.typedNode),
        constraints,
      ),
  )

const enterBlock = (state: State, node: NestingTermLevelNode): State => {
  const [scope, ...scopes] = state.scopes
  const newScope = findScopeOfNode(scope.scopes, node)
  assert(
    newScope !== undefined,
    'All scopes should have been built during analyze.',
  )
  return {
    ...state,
    scopes: [newScope, scope, ...scopes],
    typeAssignments: [[], ...state.typeAssignments],
    typedScopes: [[], ...state.typedScopes],
  }
}

const leaveBlock = (
  answer: Answer<State, Return<NestingTermLevelNode>>,
): State => {
  const [scope, parentScope, ...parentScopes] = answer.state.scopes
  const [
    typedScopes,
    parentTypedScopes,
    ...remainingTypedScopes
  ] = answer.state.typedScopes
  const [
    typeAssignments,
    ...remainingTypeAssignments
  ] = answer.state.typeAssignments

  assert(
    !isFileScope(scope) &&
      parentScope !== undefined &&
      parentTypedScopes !== undefined,
    'Cannot leave file-level scope.',
  )

  const typedScope = buildTypedNestedScope(
    scope,
    typedScopes,
    answer.typedNode,
    typeAssignments,
  )
  return {
    ...answer.state,
    scopes: [parentScope, ...parentScopes],
    typedScopes: [[typedScope, ...parentTypedScopes], ...remainingTypedScopes],
    typeAssignments: remainingTypeAssignments,
  }
}

const nest = <T extends NestingTermLevelNode>(
  state: State,
  node: T,
  context: Context,
  callback: (
    state: State,
    node: T,
    context: Context,
  ) => Answers<State, Return<NestingTermLevelNode>>,
) => {
  const nestedState = enterBlock(state, node)
  const answers = callback(nestedState, node, context)
  return mapAnswers(answers, (answer) => [
    buildAnswer(leaveBlock(answer), { typedNode: answer.typedNode }),
  ])
}

const traverseAll = <T extends NonTypeLevelNode>(
  state: State,
  nodes: T[],
  buildConcreteContext: () => Context = buildContext,
) =>
  reduceAnswers<State, { results: Return<T>[] }, T>(
    nodes,
    ({ state, results }, node) => {
      const context = buildConcreteContext()
      const answers = traverse(state, node, context)
      return mapAnswers(answers, ({ state, typedNode }) => [
        buildAnswer(state, { results: [...results, { typedNode }] }),
      ])
    },
    [buildAnswer(state, { results: [] })],
  )

const ensureIsInstanceOf = <T extends NonTypeLevelNode>(
  answer: Answer<State, Return<T>>,
  { type, constraints }: Context,
): Answers<State, Return<T>> =>
  mapAnswers(
    isInstanceOf(answer.state, answer.typedNode.type, type, constraints),
    ({ state, constraints }) =>
      mapAnswers(
        unifyConstraints(state, constraints, answer.typedNode.constraints),
        ({ state, constraints }) => [
          buildAnswer(state, {
            typedNode: { ...answer.typedNode, constraints },
          }),
        ],
      ),
  )

const traverse = <T extends NonTypeLevelNode>(
  state: State,
  node: T,
  context: Context,
): Answers<State, Return<T>> => {
  const answers = traverseScopes(
    node,
    () => handleNode(state, node, context),
    (node) =>
      nest(
        state,
        node,
        context,
        (state, node, context) =>
          handleNode(state, node, context) as Answers<
            State,
            Return<NestingTermLevelNode>
          >,
      ),
  ) as Answers<State, Return<T>>
  assert(answers.length > 0, 'The universe requires at least one answer.')
  return mapAnswers(answers, (answer) => ensureIsInstanceOf(answer, context))
}

const handleNode = (
  state: State,
  node: NonTypeLevelNode,
  context: Context,
): Answers<State, Return> => {
  switch (node.type) {
    case SyntaxType.ERROR:
      return handleError(state, node, context)

    case SyntaxType.Abstraction:
      throw new NotImplementedError(
        'Tony cannot infer the type of abstractions yet.',
      )
    case SyntaxType.AbstractionBranch:
      throw new NotImplementedError(
        'Tony cannot infer the type of abstraction branches yet.',
      )
    case SyntaxType.Access:
      throw new NotImplementedError(
        'Tony cannot infer the type of access operations yet.',
      )
    case SyntaxType.Application:
      throw new NotImplementedError(
        'Tony cannot infer the type of applications yet.',
      )
    case SyntaxType.Argument:
      throw new NotImplementedError(
        'Tony cannot infer the type of arguments yet.',
      )
    case SyntaxType.Assignment:
      throw new NotImplementedError(
        'Tony cannot infer the type of assignments yet.',
      )
    case SyntaxType.Block:
      throw new NotImplementedError('Tony cannot infer the type of blocks yet.')
    case SyntaxType.Boolean:
      return [buildPrimitiveAnswer(state, node, BOOLEAN_TYPE, {}, {})]
    case SyntaxType.Case:
      throw new NotImplementedError('Tony cannot infer the type of cases yet.')
    case SyntaxType.Class:
      throw new NotImplementedError(
        'Tony cannot infer the type of classes yet.',
      )
    case SyntaxType.ClassMember:
      throw new NotImplementedError(
        'Tony cannot infer the type of classes yet.',
      )
    case SyntaxType.DestructuringPattern:
      throw new NotImplementedError(
        'Tony cannot infer the type of destructuring patterns yet.',
      )
    case SyntaxType.ElseIf:
      throw new NotImplementedError(
        'Tony cannot infer the type of else ifs yet.',
      )
    case SyntaxType.Enum:
      throw new NotImplementedError('Tony cannot infer the type of enums yet.')
    case SyntaxType.EnumValue:
      throw new NotImplementedError(
        'Tony cannot infer the type of enum values yet.',
      )
    case SyntaxType.Export:
      throw new NotImplementedError(
        'Tony cannot infer the type of exports yet.',
      )
    case SyntaxType.Generator:
      throw new NotImplementedError(
        'Tony cannot infer the type of generators yet.',
      )
    case SyntaxType.Group:
      throw new NotImplementedError('Tony cannot infer the type of groups yet.')
    case SyntaxType.Identifier:
      throw new NotImplementedError(
        'Tony cannot infer the type of identifiers yet.',
      )
    case SyntaxType.IdentifierPattern:
      throw new NotImplementedError(
        'Tony cannot infer the type of identifier patterns yet.',
      )
    case SyntaxType.If:
      throw new NotImplementedError('Tony cannot infer the type of ifs yet.')
    case SyntaxType.InfixApplication:
      throw new NotImplementedError(
        'Tony cannot infer the type of infix applications yet.',
      )
    case SyntaxType.Instance:
      throw new NotImplementedError(
        'Tony cannot infer the type of instances yet.',
      )
    case SyntaxType.Interpolation:
      throw new NotImplementedError(
        'Tony cannot infer the type of interpolations yet.',
      )
    case SyntaxType.LeftSection:
      throw new NotImplementedError(
        'Tony cannot infer the type of left sections yet.',
      )
    case SyntaxType.List:
      throw new NotImplementedError('Tony cannot infer the type of lists yet.')
    case SyntaxType.ListComprehension:
      throw new NotImplementedError(
        'Tony cannot infer the type of list comprehensions yet.',
      )
    case SyntaxType.ListPattern:
      throw new NotImplementedError(
        'Tony cannot infer the type of list patterns yet.',
      )
    case SyntaxType.Member:
      throw new NotImplementedError(
        'Tony cannot infer the type of members yet.',
      )
    case SyntaxType.MemberPattern:
      throw new NotImplementedError(
        'Tony cannot infer the type of member patterns yet.',
      )
    case SyntaxType.Number:
      return [buildPrimitiveAnswer(state, node, NUMBER_TYPE, {}, {})]
    case SyntaxType.PatternGroup:
      throw new NotImplementedError(
        'Tony cannot infer the type of pattern groups yet.',
      )
    case SyntaxType.Pipeline:
      throw new NotImplementedError(
        'Tony cannot infer the type of pipelines yet.',
      )
    case SyntaxType.PrefixApplication:
      throw new NotImplementedError(
        'Tony cannot infer the type of prefix applications yet.',
      )
    case SyntaxType.Program:
      return handleProgram(state, node)
    case SyntaxType.RawString:
      return [buildPrimitiveAnswer(state, node, STRING_TYPE, {}, {})]
    case SyntaxType.Regex:
      return [buildPrimitiveAnswer(state, node, REG_EXP_TYPE, {}, {})]
    case SyntaxType.Return:
      throw new NotImplementedError(
        'Tony cannot infer the type of returns yet.',
      )
    case SyntaxType.RightSection:
      throw new NotImplementedError(
        'Tony cannot infer the type of right sections yet.',
      )
    case SyntaxType.ShorthandAccessIdentifier:
      throw new NotImplementedError(
        'Tony cannot infer the type of shorthand access identifiers yet.',
      )
    case SyntaxType.ShorthandMemberPattern:
      throw new NotImplementedError(
        'Tony cannot infer the type of shorthand member patterns yet.',
      )
    case SyntaxType.ShorthandMemberIdentifier:
      throw new NotImplementedError(
        'Tony cannot infer the type of shorthand member identifiers yet.',
      )
    case SyntaxType.ShorthandMember:
      throw new NotImplementedError(
        'Tony cannot infer the type of shorthand members yet.',
      )
    case SyntaxType.Spread:
      throw new NotImplementedError(
        'Tony cannot infer the type of spreads yet.',
      )
    case SyntaxType.String:
      throw new NotImplementedError(
        'Tony cannot infer the type of strings yet.',
      )
    case SyntaxType.Struct:
      throw new NotImplementedError(
        'Tony cannot infer the type of structs yet.',
      )
    case SyntaxType.StructPattern:
      throw new NotImplementedError(
        'Tony cannot infer the type of struct patterns yet.',
      )
    case SyntaxType.TaggedPattern:
      throw new NotImplementedError(
        'Tony cannot infer the type of tagged patterns yet.',
      )
    case SyntaxType.TaggedValue:
      throw new NotImplementedError(
        'Tony cannot infer the type of tagged values yet.',
      )
    case SyntaxType.Tuple:
      throw new NotImplementedError('Tony cannot infer the type of tuples yet.')
    case SyntaxType.TuplePattern:
      throw new NotImplementedError(
        'Tony cannot infer the type of tuple patterns yet.',
      )
    case SyntaxType.TypeAlias:
      throw new NotImplementedError(
        'Tony cannot infer the type of type aliases yet.',
      )
    case SyntaxType.TypeHint:
      throw new NotImplementedError(
        'Tony cannot infer the type of type hints yet.',
      )
    case SyntaxType.When:
      throw new NotImplementedError('Tony cannot infer the type of whens yet.')
  }
}

const handleError = (
  state: State,
  node: ErrorNode,
  { type, constraints }: Context,
): Answers<State, Return<ErrorNode>> => {
  const typedNode = buildTypedNode(node, type, constraints, {}, {})
  return [buildAnswer(state, { typedNode })]
}

const handleProgram = (
  state: State,
  node: ProgramNode,
): Answers<State, Return<ProgramNode>> => {
  if (node.termNodes.length === 0)
    return [buildPrimitiveAnswer(state, node, VOID_TYPE, { termNodes: [] }, {})]
  return mapAnswers(traverseAll(state, node.termNodes), (answer) =>
    wrapAnswer(answer, (state, termNodes, constraints) => {
      assert(
        termNodes.length > 0,
        'When there is at least one term, results must also include at least one term.',
      )
      const type = termNodes[termNodes.length - 1].type
      return [
        buildAnswer(state, {
          typedNode: buildTypedNode(node, type, constraints, { termNodes }, {}),
        }),
      ]
    }),
  )
}
