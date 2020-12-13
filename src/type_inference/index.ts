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
import { ProgramNode, SyntaxNode } from 'tree-sitter-tony'
import { Answers } from '../types/type_inference/answers'
import { assert } from '../types/errors/internal'
import { buildIndeterminateTypeError } from '../types/errors/annotations'
import { ensure } from '../util/traverse'

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
    answers,
    scopes: [finalFileScope],
  } = ensure<State<ProgramNode>, ProgramNode>(
    ({ answers }) => answers.length === 1,
    (state) => state,
    buildIndeterminateTypeError(state.answers),
  )(state, fileScope.node)
  const answer = answers[0]
  assert(
    isFileScope(finalFileScope),
    'Traverse should arrive at the top-level file scope.',
  )

  return buildTypedFileScope(finalFileScope, answer)
}

const traverse = <T extends SyntaxNode>(
  state: State<T>,
  node: T,
): State<T> => {}
