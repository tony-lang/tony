import {
  NonExhaustivePatterns,
  PatternDoesNotMatch,
  PatternDoesOnlyPartiallyMatch,
} from '../types/errors/runtime'
import { patternMatch } from './patternMatch'

export const resolveAbstractionBranch = (
  args: unknown,
  branches: [string, unknown[], (match: unknown[]) => unknown][],
  alternativeBranch?: () => unknown,
  allowFewerArguments = true,
): unknown => {
  let match

  for (const [pattern, defaults, branch] of branches) {
    try {
      match = patternMatch(
        { defaults, allowFewerArguments, allowMoreArguments: false },
        pattern,
        args,
      )
    } catch (error) {
      // branch pattern does not match arguments, try next branch
      if (error instanceof PatternDoesNotMatch) continue
      else if (error instanceof PatternDoesOnlyPartiallyMatch) match = undefined
    }

    // in the case of partial application, return undefined
    return match === undefined ? undefined : branch(match)
  }

  if (alternativeBranch) return alternativeBranch()

  throw new NonExhaustivePatterns()
}
