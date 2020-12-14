import {
  FileScope,
  GlobalScope,
  ScopeStack,
  TypedFileScope,
  buildTypedFileScope,
  isFileScope,
} from '../types/analyze/scopes'
import { Config } from '../config'
import { LogLevel, log } from '../logger'
import { ErrorNode, ProgramNode, SyntaxNode, SyntaxType } from 'tree-sitter-tony'
import { Answer, Answers, buildAnswer } from '../types/type_inference/answers'
import { assert } from '../types/errors/internal'
import { buildIndeterminateTypeError } from '../types/errors/annotations'
import { ensure } from '../util/traverse'
import { buildConstrainedType, buildTypeVariable } from '../types/type_inference/types'

type State<T extends SyntaxNode> = {
  typedFileScopes: TypedFileScope[]
  /**
   * Represents a disjunction of possible type annotations for a given syntax
   * node. Answers are empty on the way down the stack.
   */
  answers: Answers<T>
  /**
   * A stack of all scopes starting with the closest scope and ending with the
   * symbol table. Scopes are collected recursively.
   */
  scopes: ScopeStack<FileScope>
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
  const initialState: State<ProgramNode> = {
    typedFileScopes,
    answers: [],
    scopes: [fileScope],
  }

  const state = traverse(initialState, fileScope.node)
  const {
    answers: [answer],
    scopes: [finalFileScope],
  } = ensure<State<ProgramNode>, ProgramNode>(
    ({ answers }) => answers.length === 1,
    (state) => state,
    buildIndeterminateTypeError(state.answers),
  )(state, fileScope.node)
  assert(
    isFileScope(finalFileScope),
    'Traverse should arrive at the top-level file scope.',
  )

  return buildTypedFileScope(finalFileScope, answer)
}

const addAnswer = <T extends SyntaxNode>(state: State<T>, answer: Answer<T>): State<T> => ({
  ...state,
  answers: [...state.answers, answer]
})

const traverse = <T extends SyntaxNode>(
  state: State<T>,
  node: T,
): State<T> => {
  if (!node.isNamed) return state

  switch (node.type) {
    case SyntaxType.ERROR:
      return handleError(state, node)
  }
}

const handleError = (state: State<ErrorNode>, node: ErrorNode): State<ErrorNode> => {
  const type = buildConstrainedType(buildTypeVariable())
  const answer = buildAnswer(node, type)
  return addAnswer(state, answer)
}
