import {
  PatternMatch,
  PatternNotMatching,
  PatternPartiallyMatching,
} from './PatternMatch'

export class NonExhaustivePatterns extends Error {}

export class ResolveAbstractionBranch {
  static perform = (
    args: any,
    branches: [string, any[], (match: any[]) => any][],
    alternativeBranch?: () => any,
    partialMatching = true,
  ): any => {
    let match

    for (const [pattern, defaults, branch] of branches) {
      try {
        match = new PatternMatch({ defaults, partialMatching }).perform(
          pattern,
          args,
        )
      } catch (error) {
        // branch pattern does not match arguments, try next branch
        if (error instanceof PatternNotMatching) continue
        else if (error instanceof PatternPartiallyMatching) match = undefined
      }

      // in the case of partial application, return undefined
      return match === undefined ? undefined : branch(match)
    }

    if (alternativeBranch) return alternativeBranch()

    throw new NonExhaustivePatterns('Non-exhaustive patterns')
  }
}
