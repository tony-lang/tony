import { AbstractScope } from './types/state'
import { GlobalScope } from './types/analyze/scopes'
import { MountedErrorAnnotation } from './types/errors/annotations'
import { Report } from './types/errors/reports'

/**
 * Collects all mounted errors of a recursive scope.
 */
export const collectErrors = (scope: AbstractScope): MountedErrorAnnotation[] =>
  [scope.errors, ...scope.scopes.map(collectErrors)].flat()

/**
 * Determines whether a recursive scope has any mounted errors.
 */
export const hasError = (scope: AbstractScope): boolean =>
  collectErrors(scope).length > 0

/**
 * Collects all errors of a global scope.
 */
export const buildReport = (scope: GlobalScope): Report => ({
  errors: scope.errors,
  mountedErrors: scope.scopes.map((fileScope) => ({
    file: fileScope.dependency.file,
    errors: collectErrors(fileScope),
  })),
})

/**
 * Determines whether a global scope has any immediate or mounted errors.
 */
export const reportHasError = (report: Report): boolean =>
  report.errors.length > 0 ||
  report.mountedErrors.some(({ errors }) => errors.length > 0)
