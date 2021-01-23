import { AbstractState } from '../types/state'
import { ErrorAnnotation } from '../types/errors/annotations'
import { SyntaxNode } from 'tree-sitter-tony'
import { addErrorToScope } from './scopes'

export const addError = <T extends AbstractState>(
  state: T,
  node: SyntaxNode,
  error: ErrorAnnotation,
): T => {
  const [scope, ...parentScopes] = state.scopes
  const newScope = addErrorToScope(scope, node, error)
  return {
    ...state,
    scopes: [newScope, ...parentScopes],
  }
}

export const addErrorUnless = <T extends AbstractState>(
  predicate: boolean,
  error: ErrorAnnotation,
) => (state: T, node: SyntaxNode): T => {
  if (predicate) return state
  return addError(state, node, error)
}

/**
 * Checks predicate. If true, returns callback. Else, adds error annotation.
 */
export const ensure = <T extends AbstractState, U extends SyntaxNode>(
  predicate: (state: T, node: U) => boolean,
  callback: (state: T, node: U) => T,
  error: ErrorAnnotation,
) => (state: T, node: U): T => {
  if (predicate(state, node)) return callback(state, node)
  return addError(state, node, error)
}

/**
 * Conditionally applies argument to callback depending on whether it exists.
 */
export const conditionalApply = <T extends AbstractState, U>(
  callback: (state: T, arg: U) => T,
) => (state: T, arg: U | undefined): T => {
  if (arg) return callback(state, arg)
  return state
}
