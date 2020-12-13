import { SyntaxNode } from 'tree-sitter-tony'
import { FileScope, ScopeStack } from '../types/analyze/scopes'
import { ErrorAnnotation } from '../types/errors/annotations'

type State = {
  scopes: ScopeStack<FileScope>
}

export const addError = <T extends State>(
  state: T,
  node: SyntaxNode,
  error: ErrorAnnotation,
): T => {
  const [scope, ...parentScopes] = state.scopes
  const newScope = {
    ...scope,
    errors: [...scope.errors, { node, error }],
  }
  return {
    ...state,
    scopes: [newScope, ...parentScopes],
  }
}

/**
 * Checks predicate. If true, returns callback. Else, adds error annotation.
 */
export const ensure = <T extends State, U extends SyntaxNode>(
  predicate: (state: T, node: U) => boolean,
  callback: (state: T, node: U) => T,
  error: ErrorAnnotation,
) => (state: T, node: U) => {
  if (predicate(state, node)) return callback(state, node)
  return addError(state, node, error)
}

/**
 * Conditionally applies argument to callback depending on whether it exists.
 */
export const conditionalApply = <T extends State, U>(
  callback: (state: T, arg: U) => T,
) => (state: T, arg: U | undefined): T => {
  if (arg) return callback(state, arg)
  return state
}
