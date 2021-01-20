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
import {
  BOOLEAN_TYPE,
  NUMBER_TYPE,
  PrimitiveType,
  REG_EXP_TYPE,
  STRING_TYPE,
  VOID_TYPE,
} from '../types/type_inference/primitive_types'
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
import {
  TypeConstraints,
  buildTypeConstraints,
} from '../types/type_inference/constraints'
import { TypedNode, buildTypedNode } from '../types/type_inference/nodes'
import {
  buildIndeterminateTypeError,
  buildTypeErrorFromConstrainedTypes,
} from '../types/errors/annotations'
import { Config } from '../config'
import { ResolvedType } from '../types/type_inference/categories'
import { TypeAssignment } from '../types/analyze/bindings'
import { addErrorUnless } from '../util/traverse'
import { buildTemporaryTypeVariable } from '../types/type_inference/types'
import { collectErrors } from '../errors'
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
 * An answer represents a type annotation for a given node in the syntax tree
 * alongside a state.
 */
type Answer<T extends TermNode> = {
  state: State
  typedNode: TypedNode<T>
}

/**
 * Represents a disjunction of possible type annotations. for a given node in
 * the syntax tree.
 */
type Answers<T extends TermNode> = Answer<T>[]

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
    buildIndeterminateTypeError(getTypedNodesFromAnswers(answers)),
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

const getTypedNodesFromAnswers = <T extends TermNode>(answers: Answers<T>) =>
  answers.map((answer) => answer.typedNode)

const getTypeConstraintsFromAnswers = <T extends TermNode>(
  answers: Answers<T>,
) => answers.map((answer) => answer.typedNode.constraints)

const buildAnswer = <T extends TermNode>(
  state: State,
  typedNode: TypedNode<T>,
): Answer<T> => ({
  state,
  typedNode,
})

const buildPrimitiveAnswer = <T extends TermNode>(type: PrimitiveType) => (
  state: State,
  node: T,
): Answer<T> =>
  buildAnswer(state, buildTypedNode(node, type, buildTypeConstraints()))

const buildEmptyAnswer = buildPrimitiveAnswer(VOID_TYPE)

const wrapAnswer = <T extends TermNode>(
  node: T,
  childNodes: Answers<TermNode>,
  answer: Answer<TermNode>,
): Answer<T> => {
  const [stateWithConstraints, constraints] = unifyConstraints(
    answer.state,
    ...childNodes.map((answer) => answer.typedNode.constraints),
  )
  return buildAnswer(
    stateWithConstraints,
    buildTypedNode(
      node,
      answer.typedNode.type,
      constraints,
      getTypedNodesFromAnswers(childNodes),
    ),
  )
}

const filterAnswers = <T extends TermNode>(answers: Answers<T>): Answers<T> => {
  assert(answers.length > 0, 'There must always be at least one answer.')

  // Remove answers with errors if there are some answers without errors.
  const answersWithNoOfErrors: [
    answer: Answer<T>,
    numberOfErrors: number,
  ][] = answers.map((answer) => [
    answer,
    collectErrors(answer.state.scopes[0]).length,
  ])
  const answersWithoutErrors = answersWithNoOfErrors.filter(([, n]) => n === 0)
  if (answersWithoutErrors.length > 0)
    return answersWithoutErrors.map(([answer]) => answer)

  // Proceed with the answer with the fewest errors if all answers have errors.
  const answersSortedByNoOfErrors = answersWithNoOfErrors.sort(
    ([, a], [, b]) => a - b,
  )
  return [answersSortedByNoOfErrors.map(([answer]) => answer)[0]]
}

const reduceAnswers = <T extends TermNode>(answers: Answers<T>[]) =>
  filterAnswers(answers.flat())

const forAllAnswers = <T extends TermNode, U extends TermNode>(
  answers: Answers<T>,
  callback: (answer: Answer<T>) => Answers<U>,
) => reduceAnswers(answers.map((answer) => callback(answer)))

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

const leaveBlock = (answer: Answer<NestingNode & TermNode>): State => {
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

const nest = <T extends NestingNode & TermNode>(
  callback: (
    state: State,
    node: T,
    type: ResolvedType,
    constraints: TypeConstraints,
  ) => Answers<T>,
) => (
  state: State,
  node: T,
  type: ResolvedType,
  constraints: TypeConstraints,
) => {
  const nestedState = enterBlock(state, node)
  const answers = callback(nestedState, node, type, constraints)
  return forAllAnswers(answers, (answer) => [
    buildAnswer(leaveBlock(answer), answer.typedNode),
  ])
}

const traverseAll = <T extends TermNode>(
  nodes: T[],
  initialState: State,
  typeFactory: (
    constraints: TypeConstraints,
    node: T,
  ) => [ResolvedType, TypeConstraints] = () => [
    buildTemporaryTypeVariable(),
    buildTypeConstraints(),
  ],
) =>
  nodes.reduce<Answers<T>>((answers, node) => {
    const typeConstraints =
      answers.length > 0
        ? getTypeConstraintsFromAnswers(answers)
        : [buildTypeConstraints()]
    return reduceAnswers(
      typeConstraints.map((constraint) => {
        const [type, constraints] = typeFactory(constraint, node)
        return traverse(initialState, node, type, constraints)
      }),
    )
  }, [])

const unifyConstraintsWithTypedNode = <T extends TermNode>(
  state: State,
  typedNode: TypedNode<T>,
  constraints: TypeConstraints,
): [newState: State, typedNode: TypedNode<T>] => {
  const [newState, unifiedConstraints] = unifyConstraints(
    state,
    constraints,
    typedNode.constraints,
  )
  return [
    newState,
    {
      ...typedNode,
      constraints: unifiedConstraints,
    },
  ]
}

const ensureIsInstanceOf = <T extends TermNode>(
  node: T,
  answer: Answer<T>,
  generalType: ResolvedType,
  constraints: TypeConstraints,
): Answer<T> => {
  const [newState, predicate, newConstraints] = isInstanceOf(
    answer.state,
    answer.typedNode.type,
    generalType,
    constraints,
  )
  const error = buildTypeErrorFromConstrainedTypes(
    generalType,
    answer.typedNode.type,
    newConstraints,
  )
  const stateWithError = addErrorUnless<State>(predicate, error)(newState, node)
  const [
    stateWithUnifiedConstraints,
    typedNode,
  ] = unifyConstraintsWithTypedNode(
    stateWithError,
    answer.typedNode,
    newConstraints,
  )
  return buildAnswer(stateWithUnifiedConstraints, typedNode)
}

const traverse = <T extends TermNode>(
  state: State,
  node: T,
  type: ResolvedType,
  constraints: TypeConstraints,
): Answers<T> => {
  const answers = handleNode(state, node, type, constraints) as Answers<T>
  assert(
    answers.length > 0,
    'There must always be returned at least one answer (that may contain errors).',
  )
  return forAllAnswers(answers, (answer) => [
    ensureIsInstanceOf(node, answer, type, constraints),
  ])
}

const handleNode = (
  state: State,
  node: TermNode,
  type: ResolvedType,
  constraints: TypeConstraints,
): Answers<TermNode> => {
  switch (node.type) {
    case SyntaxType.ERROR:
      return handleError(state, node, type, constraints)

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
      return [buildPrimitiveAnswer(BOOLEAN_TYPE)(state, node)]
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
      return [buildPrimitiveAnswer(NUMBER_TYPE)(state, node)]
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
      return [buildPrimitiveAnswer(STRING_TYPE)(state, node)]
    case SyntaxType.Regex:
      return [buildPrimitiveAnswer(REG_EXP_TYPE)(state, node)]
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
  type: ResolvedType,
  constraints: TypeConstraints,
): Answers<ErrorNode> => {
  const typedNode = buildTypedNode(node, type, constraints)
  return [buildAnswer(state, typedNode)]
}

const handleProgram = (
  state: State,
  node: ProgramNode,
): Answers<ProgramNode> => {
  const termAnswers = traverseAll(node.termNodes, state)
  return forAllAnswers(termAnswers, (termAnswer) => [
    wrapAnswer(node, termAnswers, termAnswer),
  ])
}
