import {
  AbstractionBranchNode,
  AbstractionNode,
  AccessNode,
  ApplicationNode,
  ArgumentNode,
  AssignmentNode,
  BlockNode,
  BooleanNode,
  CaseNode,
  DestructuringPatternNode,
  ElseIfNode,
  EnumNode,
  EnumValueNode,
  ErrorNode,
  ExportNode,
  ExportedImportNode,
  GeneratorNode,
  GroupNode,
  IdentifierNode,
  IdentifierPatternNode,
  IfNode,
  ImportIdentifierNode,
  ImportNode,
  ImportTypeNode,
  InfixApplicationNode,
  InterfaceNode,
  InterpolationNode,
  LeftSectionNode,
  ListComprehensionNode,
  ListNode,
  ListPatternNode,
  MemberNode,
  MemberPatternNode,
  NumberNode,
  PatternGroupNode,
  PipelineNode,
  PrefixApplicationNode,
  ProgramNode,
  RawStringNode,
  RegexNode,
  RestNode,
  ReturnNode,
  RightSectionNode,
  ShorthandMemberPatternNode,
  SpreadNode,
  StringNode,
  StructNode,
  StructPatternNode,
  SyntaxType,
  TaggedPatternNode,
  TaggedValueNode,
  TupleNode,
  TuplePatternNode,
  TypeAliasNode,
  TypeHintNode,
  WhenNode,
} from 'tree-sitter-tony'
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
import {
  FileScope,
  GlobalScope,
  NestedScope,
  NestingNode,
  TypedFileScope,
  TypedNestedScope,
  buildTypedFileScope,
  buildTypedNestedScope,
  isFileScope,
} from '../types/analyze/scopes'
import { LogLevel, log } from '../logger'
import { NotImplementedError, assert } from '../types/errors/internal'
import { TypedNode, buildTypedNode } from '../types/type_inference/nodes'
import { mapAnswers, reduceAnswers } from '../util/answers'
import { Config } from '../config'
import { ResolvedType } from '../types/type_inference/categories'
import { TypeAssignment } from '../types/analyze/bindings'
import { addErrorUnless } from '../util/traverse'
import { buildAmbiguousTypeError } from '../types/errors/annotations'
import { buildTemporaryTypeVariable } from '../types/type_inference/types'
import { findScopeOfNode } from '../util/scopes'
import { isInstanceOf } from './instances'
import { unifyConstraints } from './constraints'

type TermNode =
  | AbstractionNode
  | AbstractionBranchNode
  | AccessNode
  | ApplicationNode
  | ArgumentNode
  | AssignmentNode
  | BlockNode
  | BooleanNode
  | CaseNode
  | DestructuringPatternNode
  | ElseIfNode
  | EnumNode
  | EnumValueNode
  | ExportNode
  | ExportedImportNode
  | GeneratorNode
  | GroupNode
  | IdentifierNode
  | IdentifierPatternNode
  | IfNode
  | ImportNode
  | ImportIdentifierNode
  | ImportTypeNode
  | InfixApplicationNode
  | InterfaceNode
  | InterpolationNode
  | LeftSectionNode
  | ListNode
  | ListComprehensionNode
  | ListPatternNode
  | MemberNode
  | MemberPatternNode
  | NumberNode
  | PatternGroupNode
  | PipelineNode
  | PrefixApplicationNode
  | ProgramNode
  | RawStringNode
  | RegexNode
  | RestNode
  | ReturnNode
  | RightSectionNode
  | ShorthandMemberPatternNode
  | SpreadNode
  | StringNode
  | StructNode
  | StructPatternNode
  | TaggedPatternNode
  | TaggedValueNode
  | TupleNode
  | TuplePatternNode
  | TypeAliasNode
  | TypeHintNode
  | WhenNode
  | ErrorNode

type State = {
  /**
   * A list of file scopes that are already typed.
   */
  typedFileScopes: TypedFileScope[]
  /**
   * A stack of all scopes starting with the closest scope and ending with the
   * symbol table.
   */
  scopes: (FileScope | NestedScope)[]
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
type Return<T extends TermNode> = { typedNode: TypedNode<T> }

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
    scopes: [fileScope],
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

const buildPrimitiveAnswer = <T extends TermNode>(
  state: State,
  node: T,
  type: PrimitiveType,
): Answer<State, Return<T>> =>
  buildAnswer(state, {
    typedNode: buildTypedNode(node, type, buildConstraints()),
  })

const wrapAnswer = <T extends TermNode>(
  node: T,
  answer: Answer<State, { results: Return<TermNode>[] }>,
  type: ResolvedType,
): Answers<State, Return<T>> =>
  mapAnswers(
    unifyConstraints(
      answer.state,
      ...answer.results.map((result) => result.typedNode.constraints),
    ),
    ({ state, constraints }) => [
      buildAnswer(state, {
        typedNode: buildTypedNode(
          node,
          type,
          constraints,
          answer.results.map((result) => result.typedNode),
        ),
      }),
    ],
  )

const enterBlock = (state: State, node: NestingNode): State => {
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
  answer: Answer<State, Return<NestingNode & TermNode>>,
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nest = <T extends NestingNode & TermNode>(
  callback: (
    state: State,
    node: T,
    context: Context,
  ) => Answers<State, Return<T>>,
) => (state: State, node: T, context: Context) => {
  const nestedState = enterBlock(state, node)
  const answers = callback(nestedState, node, context)
  return mapAnswers(answers, (answer) => [
    buildAnswer(leaveBlock(answer), { typedNode: answer.typedNode }),
  ])
}

const traverseAll = <T extends TermNode>(
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

const ensureIsInstanceOf = <T extends TermNode>(
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

const traverse = <T extends TermNode>(
  state: State,
  node: T,
  context: Context,
): Answers<State, Return<T>> => {
  const answers = handleNode(state, node, context) as Answers<State, Return<T>>
  assert(answers.length > 0, 'The universe requires at least one answer.')
  return mapAnswers(answers, (answer) => ensureIsInstanceOf(answer, context))
}

const handleNode = (
  state: State,
  node: TermNode,
  context: Context,
): Answers<State, Return<TermNode>> => {
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
      return [buildPrimitiveAnswer(state, node, BOOLEAN_TYPE)]
    case SyntaxType.Case:
      throw new NotImplementedError('Tony cannot infer the type of cases yet.')
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
    case SyntaxType.ExportedImport:
      throw new NotImplementedError(
        'Tony cannot infer the type of exported imports yet.',
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
    case SyntaxType.Import:
      throw new NotImplementedError(
        'Tony cannot infer the type of imports yet.',
      )
    case SyntaxType.ImportIdentifier:
      throw new NotImplementedError(
        'Tony cannot infer the type of identifier imports yet.',
      )
    case SyntaxType.ImportType:
      throw new NotImplementedError(
        'Tony cannot infer the type of type imports yet.',
      )
    case SyntaxType.InfixApplication:
      throw new NotImplementedError(
        'Tony cannot infer the type of infix applications yet.',
      )
    case SyntaxType.Interface:
      throw new NotImplementedError(
        'Tony cannot infer the type of interfaces yet.',
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
      return [buildPrimitiveAnswer(state, node, NUMBER_TYPE)]
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
      return [buildPrimitiveAnswer(state, node, STRING_TYPE)]
    case SyntaxType.Regex:
      return [buildPrimitiveAnswer(state, node, REG_EXP_TYPE)]
    case SyntaxType.Rest:
      throw new NotImplementedError(
        'Tony cannot infer the type of rest parameters yet.',
      )
    case SyntaxType.Return:
      throw new NotImplementedError(
        'Tony cannot infer the type of returns yet.',
      )
    case SyntaxType.RightSection:
      throw new NotImplementedError(
        'Tony cannot infer the type of right sections yet.',
      )
    case SyntaxType.ShorthandMemberPattern:
      throw new NotImplementedError(
        'Tony cannot infer the type of shorthand member patterns yet.',
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
  const typedNode = buildTypedNode(node, type, constraints)
  return [buildAnswer(state, { typedNode })]
}

const handleProgram = (
  state: State,
  node: ProgramNode,
): Answers<State, Return<ProgramNode>> => {
  const answers = traverseAll(state, node.termNodes)
  return mapAnswers(answers, (answer) => {
    if (answer.results.length === 0)
      return [buildPrimitiveAnswer(answer.state, node, VOID_TYPE)]
    const type = answer.results[answer.results.length - 1].typedNode.type
    return wrapAnswer(node, answer, type)
  })
}
