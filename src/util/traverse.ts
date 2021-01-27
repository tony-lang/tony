import { NamedNode, SyntaxNode } from 'tree-sitter-tony'
import { NestingNode, isNestingNode } from '../types/analyze/scopes'
import { AbstractState } from '../types/state'
import { ErrorAnnotation } from '../types/errors/annotations'
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
 * Conditionally applies argument to state reduces depending on whether it
 * exists.
 */
export const conditionalApply = <T extends AbstractState, U>(
  callback: (state: T, arg: U) => T,
) => (state: T, arg: U | undefined): T => {
  if (arg) return callback(state, arg)
  return state
}

/**
 * Conditionally applies argument to callback depending on whether it exists.
 */
export const safeApply = <T extends AbstractState, U, V>(
  callback: (state: T, arg: U) => V,
) => (state: T, arg: U | undefined): V | undefined => {
  if (arg) return callback(state, arg)
}

/**
 * If node is a nesting node enter its scope; otherwise just apply the given
 * callback.
 */
export const traverseScopes = <T extends NamedNode, U>(
  node: T,
  callback: () => U,
  nest: (node: NestingNode & T) => U,
): U => {
  if (isNestingNode(node)) return nest(node)
  else return callback()
}
