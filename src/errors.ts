import { AbstractScope } from './types/state'
import { GlobalScope } from './types/analyze/scopes'
import { MountedErrorAnnotation } from './types/errors/annotations'
import { Report } from './types/errors/reports'

export const collectErrors = (scope: AbstractScope): MountedErrorAnnotation[] =>
  [scope.errors, ...scope.scopes.map(collectErrors)].flat()

export const hasError = (scope: AbstractScope): boolean =>
  collectErrors(scope).length > 0

export const buildReport = (scope: GlobalScope): Report => ({
  errors: scope.errors,
  mountedErrors: scope.scopes.map((fileScope) => [
    fileScope.file,
    collectErrors(fileScope),
  ]),
})

export const reportHasError = (report: Report): boolean =>
  report.errors.length > 0 ||
  report.mountedErrors.some(([, errors]) => errors.length > 0)
