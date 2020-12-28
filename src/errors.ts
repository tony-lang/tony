import { RecursiveScope, ScopeWithErrors } from './types/analyze/scopes'
import { MountedErrorAnnotation } from './types/errors/annotations'

interface Scope extends ScopeWithErrors, RecursiveScope<Scope> {}

export const collectErrors = (scope: Scope): MountedErrorAnnotation[] =>
  [scope.errors, ...scope.scopes.map(collectErrors)].flat()

export const hasError = (scope: Scope): boolean =>
  collectErrors(scope).length > 0
