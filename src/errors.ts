import { AbstractScope } from './types/state'
import { MountedErrorAnnotation } from './types/errors/annotations'

export const collectErrors = (scope: AbstractScope): MountedErrorAnnotation[] =>
  [scope.errors, ...scope.scopes.map(collectErrors)].flat()

export const hasError = (scope: AbstractScope): boolean =>
  collectErrors(scope).length > 0
