import {
  GlobalScope,
  RecursiveScope,
  RecursiveScopeWithErrors,
  ScopeWithErrors,
  SourceFileScope,
} from './types/analyze/scopes'
import { MountedErrorAnnotation } from './types/errors/annotations'
import { Report } from './types/errors/reports'
import { isSourceDependency } from './types/analyze/dependencies'

/**
 * Collects all mounted errors of a recursive scope.
 */
export const collectErrors = (
  scope: RecursiveScopeWithErrors,
): MountedErrorAnnotation[] =>
  [scope.errors, ...scope.scopes.map(collectErrors)].flat()

/**
 * Determines whether a recursive scope has any mounted errors.
 */
export const hasError = (scope: RecursiveScopeWithErrors): boolean =>
  collectErrors(scope).length > 0

/**
 * Collects all errors of a global scope.
 */
export const buildReport = (scope: GlobalScope): Report => ({
  errors: scope.errors,
  mountedErrors: scope.scopes
    .filter((fileScope) => isSourceDependency(fileScope.dependency))
    .map((fileScope) => ({
      file: fileScope.dependency.file,
      errors: collectErrors(fileScope as SourceFileScope),
    })),
})

/**
 * Determines whether a global scope has any immediate or mounted errors.
 */
export const reportHasError = (report: Report): boolean =>
  report.errors.length > 0 ||
  report.mountedErrors.some(({ errors }) => errors.length > 0)
