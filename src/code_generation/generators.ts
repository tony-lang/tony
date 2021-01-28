import {
  curry,
  patternMatch,
  patternMatchForAbstraction,
  resolveAbstractionBranch,
} from './lib'
import { ScopeWithTerms } from '../types/analyze/scopes'
import { generateDeclarations } from './bindings'
import { resolvePattern } from './patterns'

export const generateAbstraction = (branches: string[]): string =>
  curry(resolveAbstractionBranch(branches))

export const generateAbstractionBranch = (
  parameters: string[],
  restParameter: string | undefined,
  body: string,
): string => {
  const [pattern, identifiers, defaults] = resolvePattern(
    restParameter
      ? `[${parameters.join(',')},...${restParameter}]`
      : `[${parameters.join(',')}]`,
  )
  return `[${pattern},${defaults},${patternMatchForAbstraction(
    identifiers,
    body,
  )}]`
}

export const generateAccess = (name: string, value: string): string =>
  `${name}[${value}]`

export const generateAssignment = (pattern: string, value: string): string => {
  const [resolvedPattern, identifiers, defaults] = resolvePattern(pattern)
  return patternMatch(resolvedPattern, identifiers, defaults, value)
}

export const generateBlock = (
  scope: ScopeWithTerms,
  terms: string[],
  endsWithReturn: boolean,
): string => {
  const declarations = generateDeclarations(scope.terms)
  const returnValue = terms.pop()
  const explicitReturn = endsWithReturn ? '' : 'return '
  return `(()=>{${declarations};${terms.join(
    ';',
  )};${explicitReturn}${returnValue}})()`
}
