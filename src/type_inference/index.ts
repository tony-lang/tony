import { Answers, buildAnswer } from '../types/type_inference/answers'
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
import {
  buildConstrainedType,
  buildTypeVariable,
} from '../types/type_inference/types'
import { Config } from '../config'
import { addErrorUnless } from '../util/traverse'
import { assert } from '../types/errors/internal'
import { buildIndeterminateTypeError } from '../types/errors/annotations'

type State = {
  typedFileScopes: TypedFileScope[]
  /**
   * A stack of all scopes starting with the closest scope and ending with the
   * symbol table. Scopes are collected recursively.
   */
  scopes: ScopeStack<FileScope>
}
type StateWithAnswers<T extends SyntaxNode> = [
  state: State,
  /**
   * Represents a disjunction of possible type annotations for a given syntax
   * node. Answers are empty on the way down the stack.
   */
  answers: Answers<T>,
]

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
  }

  const [state, answers] = handleProgram(initialState, fileScope.node)
  const [answer] = answers
  const {
    scopes: [finalFileScope],
  } = addErrorUnless(
    answers.length === 1,
    buildIndeterminateTypeError(answers),
  )(state, fileScope.node)
  assert(
    isFileScope(finalFileScope),
    'Traverse should arrive at the top-level file scope.',
  )

  return buildTypedFileScope(finalFileScope, answer)
}

const traverse = (
  state: State,
  node: SyntaxNode,
): StateWithAnswers<SyntaxNode> => {
  if (!node.isNamed) return [state, []]

  switch (node.type) {
    case SyntaxType.ERROR:
      return handleError(state, node)
    case SyntaxType.Program:
      return handleProgram(state, node)
  }
}

const handleError = (
  state: State,
  node: ErrorNode,
): StateWithAnswers<ErrorNode> => {
  const type = buildConstrainedType(buildTypeVariable())
  const answer = buildAnswer(node, type)
  return [state, [answer]]
}

const handleProgram = (
  state: State,
  node: ProgramNode,
): StateWithAnswers<ProgramNode> => {}
