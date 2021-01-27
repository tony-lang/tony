import { curry, patternMatch, resolveAbstractionBranch } from './lib'
import { resolvePattern } from './patterns'

export const generateAbstraction = (branches: string[]): string =>
  curry(resolveAbstractionBranch(branches))

export const generateAbstractionBranch = (
  parameters: string[],
  restParameter: string | undefined,
  body: string,
): string => {
  const [pattern, identifiers, defaults] = resolvePattern(
    parameters,
    restParameter,
  )
  return `[${pattern},${defaults},${patternMatch(identifiers, body)}]`
}
