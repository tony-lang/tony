import {
  ConstrainedType,
  Type,
  TypeConstraints,
  buildConstrainedType,
  buildTypeConstraints,
} from '../types/type_inference/types'
import {
  ErrorNode,
  ProgramNode,
  SyntaxNode,
  SyntaxType,
} from 'tree-sitter-tony'
import {
  FileScope,
  GlobalScope,
  NestedScope,
  TypedFileScope,
  buildTypedFileScope,
  isFileScope,
} from '../types/analyze/scopes'
import { LogLevel, log } from '../logger'
import { NotImplementedError, assert } from '../types/errors/internal'
import { TypedNode, buildTypedNode } from '../types/type_inference/nodes'
import {
  buildIndeterminateTypeError,
  buildTypeErrorFromConstrainedType,
} from '../types/errors/annotations'
import { Config } from '../config'
import { TypedTermBinding } from '../types/analyze/bindings'
import { VOID_TYPE } from '../types/type_inference/primitive_types'
import { addErrorUnless } from '../util/traverse'
import { buildConstrainedUnknownType } from '../util/types'
import { collectErrors } from '../errors'
import { isInstanceOf } from './instances'
import { unifyConstraints } from './constraints'

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
   * A list of typed bindings for each scope on the scope stack.
   */
  bindings: TypedTermBinding[][]
}

/**
 * An answer represents a type annotation for a given node in the syntax tree
 * alongside a state.
 */
type Answer<T extends SyntaxNode> = {
  state: State
  typedNode: TypedNode<T>
}

/**
 * Represents a disjunction of possible type annotations. for a given node in
 * the syntax tree.
 */
type Answers<T extends SyntaxNode> = Answer<T>[]

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
    bindings: [],
  }
  const answers = handleProgram(initialState, fileScope.node)
  const [answer] = answers
  const {
    scopes: [finalFileScope],
    bindings: [finalTypedBindings],
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
    answer.typedNode,
    finalTypedBindings,
  )
}

const getTypedNodesFromAnswers = <T extends SyntaxNode>(answers: Answers<T>) =>
  answers.map((answer) => answer.typedNode)

const getTypeConstraintsFromAnswers = <T extends SyntaxNode>(
  answers: Answers<T>,
) => answers.map((answer) => answer.typedNode.type.constraints)

const buildAnswer = <T extends SyntaxNode>(
  state: State,
  typedNode: TypedNode<T>,
): Answer<T> => ({
  state,
  typedNode,
})

const buildEmptyAnswer = <T extends SyntaxNode>(
  state: State,
  node: T,
): Answer<T> =>
  buildAnswer(state, buildTypedNode(node, buildConstrainedType(VOID_TYPE)))

const wrapAnswer = <T extends SyntaxNode>(
  node: T,
  childNodes: Answers<SyntaxNode>,
  answer: Answer<SyntaxNode>,
): Answer<T> =>
  buildAnswer(
    answer.state,
    buildTypedNode(
      node,
      answer.typedNode.type,
      getTypedNodesFromAnswers(childNodes),
    ),
  )

const filterAnswers = <T extends SyntaxNode>(
  answers: Answers<T>,
): Answers<T> => {
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

const reduceAnswers = <T extends SyntaxNode>(answers: Answers<T>[]) =>
  filterAnswers(answers.flat())

const forAllAnswers = <T extends SyntaxNode, U extends SyntaxNode>(
  answers: Answers<T>,
  callback: (answer: Answer<T>) => Answers<U>,
) => reduceAnswers(answers.map((answer) => callback(answer)))

const traverseAll = <T extends SyntaxNode>(
  nodes: T[],
  initialState: State,
  typeFactory: (
    constraints: TypeConstraints,
    node: T,
  ) => ConstrainedType<Type> = buildConstrainedUnknownType,
) =>
  nodes.reduce<Answers<T>>((answers, node) => {
    const typeConstraints =
      answers.length > 0
        ? getTypeConstraintsFromAnswers(answers)
        : [buildTypeConstraints()]
    return reduceAnswers(
      typeConstraints.map((constraint) => {
        const type = typeFactory(constraint, node)
        return traverse(initialState, node, type) as Answers<T>
      }),
    )
  }, [])

const unifyConstraintsWithTypedNode = <T extends SyntaxNode>(
  typedNode: TypedNode<T>,
  constraints: TypeConstraints,
): TypedNode<T> => {
  const unifiedConstraints = unifyConstraints(
    constraints,
    typedNode.type.constraints,
  )
  return {
    ...typedNode,
    type: {
      ...typedNode.type,
      constraints: unifiedConstraints,
    },
  }
}

const ensureIsInstanceOf = <T extends SyntaxNode>(
  node: T,
  answer: Answer<T>,
  generalType: ConstrainedType<Type>,
): Answer<T> => {
  const [predicate, constraints] = isInstanceOf(
    answer.typedNode.type,
    generalType,
  )
  const error = buildTypeErrorFromConstrainedType(
    generalType,
    answer.typedNode.type,
  )
  const stateWithError = addErrorUnless<State>(predicate, error)(
    answer.state,
    node,
  )
  const typedNode = unifyConstraintsWithTypedNode(answer.typedNode, constraints)
  return buildAnswer(stateWithError, typedNode)
}

const traverse = <T extends SyntaxNode>(
  state: State,
  node: T,
  type: ConstrainedType<Type>,
): Answers<T> => {
  const answers = handleNode(state, node, type) as Answers<T>
  return forAllAnswers(answers, (answer) => [
    ensureIsInstanceOf(node, answer, type),
  ])
}

const handleNode = (
  state: State,
  node: SyntaxNode,
  type: ConstrainedType<Type>,
): Answers<SyntaxNode> => {
  assert(node.isNamed, 'The types of unnamed nodes should not be inferred.')

  switch (node.type) {
    case SyntaxType.ERROR:
      return handleError(state, node, type)
    case SyntaxType.Comment:
      return [buildEmptyAnswer(state, node)]
    case SyntaxType.HashBangLine:
      return [buildEmptyAnswer(state, node)]

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
      throw new NotImplementedError(
        'Tony cannot infer the type of booleans yet.',
      )
    case SyntaxType.Case:
      throw new NotImplementedError('Tony cannot infer the type of cases yet.')
    case SyntaxType.CurriedType:
      throw new NotImplementedError('Tony cannot build curried types yet.')
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
    case SyntaxType.EscapeSequence:
      throw new NotImplementedError(
        'Tony cannot infer the type of escape sequences yet.',
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
    case SyntaxType.IdentifierPatternName:
      throw new NotImplementedError(
        'Tony cannot infer the type of identifier patterns yet.',
      )
    case SyntaxType.If:
      throw new NotImplementedError('Tony cannot infer the type of ifs yet.')
    case SyntaxType.Implement:
      throw new NotImplementedError(
        'Tony cannot infer the type of implements yet.',
      )
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
    case SyntaxType.IntersectionType:
      throw new NotImplementedError('Tony cannot build intersection types yet.')
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
    case SyntaxType.ListType:
      throw new NotImplementedError('Tony cannot build list types yet.')
    case SyntaxType.Member:
      throw new NotImplementedError(
        'Tony cannot infer the type of members yet.',
      )
    case SyntaxType.MemberPattern:
      throw new NotImplementedError(
        'Tony cannot infer the type of member patterns yet.',
      )
    case SyntaxType.MemberType:
      throw new NotImplementedError('Tony cannot build member types yet.')
    case SyntaxType.NamedPattern:
      throw new NotImplementedError(
        'Tony cannot infer the type of named patterns yet.',
      )
    case SyntaxType.NamedType:
      throw new NotImplementedError('Tony cannot build named types yet.')
    case SyntaxType.NamedValue:
      throw new NotImplementedError(
        'Tony cannot infer the type of named values yet.',
      )
    case SyntaxType.Number:
      throw new NotImplementedError(
        'Tony cannot infer the type of numbers yet.',
      )
    case SyntaxType.ParametricType:
      throw new NotImplementedError('Tony cannot build parametric types yet.')
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
      throw new NotImplementedError(
        'Tony cannot infer the type of raw strings yet.',
      )
    case SyntaxType.RefinementType:
      throw new NotImplementedError('Tony cannot build refined types yet.')
    case SyntaxType.RefinementTypeDeclaration:
      throw new NotImplementedError('Tony cannot build refined types yet.')
    case SyntaxType.Regex:
      throw new NotImplementedError(
        'Tony cannot infer the type of regular expressions yet.',
      )
    case SyntaxType.RegexFlags:
      throw new NotImplementedError(
        'Tony cannot infer the type of regular expressions yet.',
      )
    case SyntaxType.RegexPattern:
      throw new NotImplementedError(
        'Tony cannot infer the type of regular expressions yet.',
      )
    case SyntaxType.Rest:
      throw new NotImplementedError(
        'Tony cannot infer the type of rest parameters yet.',
      )
    case SyntaxType.Return:
      throw new NotImplementedError(
        'Tony cannot infer the type of returns yet.',
      )
    case SyntaxType.ShorthandAccessIdentifier:
      throw new NotImplementedError(
        'Tony cannot infer the type of shorthand access identifiers yet.',
      )
    case SyntaxType.ShorthandMember:
      throw new NotImplementedError(
        'Tony cannot infer the type of shorthand members yet.',
      )
    case SyntaxType.ShorthandMemberIdentifier:
      throw new NotImplementedError(
        'Tony cannot infer the type of shorthand member identifiers yet.',
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
    case SyntaxType.StructType:
      throw new NotImplementedError('Tony cannot build struct types yet.')
    case SyntaxType.Tuple:
      throw new NotImplementedError('Tony cannot infer the type of tuples yet.')
    case SyntaxType.TuplePattern:
      throw new NotImplementedError(
        'Tony cannot infer the type of tuple patterns yet.',
      )
    case SyntaxType.TupleType:
      throw new NotImplementedError('Tony cannot build tuple types yet.')
    case SyntaxType.Type:
      throw new NotImplementedError('Tony cannot build types yet.')
    case SyntaxType.TypeAlias:
      throw new NotImplementedError(
        'Tony cannot infer the type of type aliases yet.',
      )
    case SyntaxType.TypeDeclaration:
      throw new NotImplementedError('Tony cannot build declared types yet.')
    case SyntaxType.TypeGroup:
      throw new NotImplementedError('Tony cannot build type groups yet.')
    case SyntaxType.TypeHint:
      throw new NotImplementedError(
        'Tony cannot infer the type of type hints yet.',
      )
    case SyntaxType.TypeVariable:
      throw new NotImplementedError('Tony cannot build type variables yet.')
    case SyntaxType.TypeVariableDeclaration:
      throw new NotImplementedError('Tony cannot build type variables yet.')
    case SyntaxType.TypeVariableDeclarationName:
      throw new NotImplementedError('Tony cannot build type variables yet.')
    case SyntaxType.Typeof:
      throw new NotImplementedError('Tony cannot build typeofs yet.')
    case SyntaxType.UnionType:
      throw new NotImplementedError('Tony cannot build union types yet.')
    case SyntaxType.When:
      throw new NotImplementedError('Tony cannot infer the type of whens yet.')
  }
}

const handleError = (
  state: State,
  node: ErrorNode,
  type: ConstrainedType<Type>,
): Answers<ErrorNode> => {
  const typedNode = buildTypedNode(node, type)
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
