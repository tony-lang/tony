import { Answers, buildAnswer } from '../types/type_inference/answers'
import { ConstrainedType, Type } from '../types/type_inference/types'
import {
  ErrorNode,
  ProgramNode,
  SyntaxNode,
  SyntaxType,
} from 'tree-sitter-tony'
import {
  FileScope,
  GlobalScope,
  ScopeStack,
  TypedFileScope,
  buildTypedFileScope,
  isFileScope,
} from '../types/analyze/scopes'
import { LogLevel, log } from '../logger'
import { NotImplementedError, assert } from '../types/errors/internal'
import { Config } from '../config'
import { TypedBindings } from '../types/analyze/bindings'
import { addErrorUnless } from '../util/traverse'
import { buildIndeterminateTypeError } from '../types/errors/annotations'
import { buildUnconstrainedUnknownType } from '../util/types'

type DownState = {
  typedFileScopes: TypedFileScope[]
  /**
   * A stack of all scopes starting with the closest scope and ending with the
   * symbol table.
   */
  scopes: ScopeStack<FileScope>
  /**
   * A stack of typed bindings for each scope on the scope stack.
   */
  bindings: TypedBindings[]
  /**
   * The initial type for type inference on the given node.
   */
  type: ConstrainedType<Type>
}
type UpState<T extends SyntaxNode> = {
  state: DownState
  /**
   * Represents a disjunction of possible type annotations for a given syntax
   * node. Answers are empty on the way down the stack.
   */
  answers: Answers<T>
}

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
  const initialState: DownState = {
    typedFileScopes,
    scopes: [fileScope],
    bindings: [],
    type: buildUnconstrainedUnknownType(),
  }

  const { state, answers } = handleProgram(initialState, fileScope.node)
  const [answer] = answers
  const {
    scopes: [finalFileScope],
    bindings: [finalTypedBindings],
  } = addErrorUnless<DownState>(
    answers.length === 1,
    buildIndeterminateTypeError(answers),
  )(state, fileScope.node)
  assert(
    isFileScope(finalFileScope),
    'Traverse should arrive at the top-level file scope.',
  )

  return buildTypedFileScope(finalFileScope, answer, finalTypedBindings)
}

const buildUpState = <T extends SyntaxNode>(
  state: DownState,
  answers: Answers<T> = [],
): UpState<T> => ({
  state,
  answers,
})

const traverse = (state: DownState, node: SyntaxNode): UpState<SyntaxNode> => {
  assert(node.isNamed, 'The types of unnamed nodes should not be inferred.')

  switch (node.type) {
    case SyntaxType.ERROR:
      return handleError(state, node)
    case SyntaxType.Comment:
      return buildUpState(state)
    case SyntaxType.HashBangLine:
      return buildUpState(state)

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

const handleError = (state: DownState, node: ErrorNode): UpState<ErrorNode> => {
  const type = buildUnconstrainedUnknownType()
  const answer = buildAnswer(node, type)
  return buildUpState(state, [answer])
}

const handleProgram = (
  state: DownState,
  node: ProgramNode,
): UpState<ProgramNode> => {}
