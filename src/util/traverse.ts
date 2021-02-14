import * as Source from 'tree-sitter-tony/tony'
import * as Declaration from 'tree-sitter-tony/dtn'
import {
  NestingNode,
  ScopeWithErrors,
  isNestingNode,
} from '../types/analyze/scopes'
import { ErrorAnnotation } from '../types/errors/annotations'
import { addErrorToScope } from './scopes'
import { buildPromise } from '.'

type StateForTraverse = {
  scopes: ScopeWithErrors[]
}

export const addError = <T extends StateForTraverse>(
  state: T,
  node: Declaration.SyntaxNode | Source.SyntaxNode,
  error: ErrorAnnotation,
): T => {
  const [scope, ...parentScopes] = state.scopes
  const newScope = addErrorToScope(scope, node, error)
  return {
    ...state,
    scopes: [newScope, ...parentScopes],
  }
}

export const addErrorUnless = <T extends StateForTraverse>(
  predicate: boolean,
  error: ErrorAnnotation,
) => (state: T, node: Declaration.SyntaxNode | Source.SyntaxNode): T => {
  if (predicate) return state
  return addError(state, node, error)
}

/**
 * Checks predicate. If true, returns callback. Else, adds error annotation.
 */
export const ensure = <
  T extends StateForTraverse,
  U extends Declaration.SyntaxNode | Source.SyntaxNode
>(
  predicate: (state: T, node: U) => boolean,
  callback: (state: T, node: U) => T,
  error: ErrorAnnotation,
) => (state: T, node: U): T => {
  if (predicate(state, node)) return callback(state, node)
  return addError(state, node, error)
}

/**
 * Checks predicate. If true, returns asynchronous callback. Else, adds error
 * annotation.
 */
export const ensureAsync = <
  T extends StateForTraverse,
  U extends Declaration.SyntaxNode | Source.SyntaxNode
>(
  predicate: (state: T, node: U) => boolean,
  callback: (state: T, node: U) => Promise<T>,
  error: ErrorAnnotation,
) => (state: T, node: U): Promise<T> => {
  if (predicate(state, node)) return callback(state, node)
  return buildPromise(addError(state, node, error))
}

/**
 * Conditionally applies argument to state reduces depending on whether it
 * exists.
 */
export const conditionalApply = <T, U>(callback: (state: T, arg: U) => T) => (
  state: T,
  arg: U | undefined,
): T => (arg && callback(state, arg)) || state

/**
 * If node is a nesting node enter its scope; otherwise just apply the given
 * callback.
 */
export const traverseScopes = <T extends Source.NamedNode, U>(
  node: T,
  callback: () => U,
  nest: (node: NestingNode & T) => U,
): U => {
  if (isNestingNode(node)) return nest(node)
  else return callback()
}
