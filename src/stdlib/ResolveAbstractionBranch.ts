import {
  PatternMatch,
  PatternNotMatching,
  PatternPartiallyMatching
} from './PatternMatch'

export class NonExhaustivePatterns extends Error {}

export class ResolveAbstractionBranch {
  static perform = (
    args: any,
    branches: [string, any[], (match: any[]) => any][],
    alternativeBranch: () => any = null
  ): any => {
    let match

    for (const [pattern, defaults, branch] of branches) {
      try {
        match = new PatternMatch({ defaults, isStrict: true })
          .perform(pattern, args)
      } catch (error) {
        // branch pattern does not match arguments, try next branch
        if (error instanceof PatternNotMatching) continue
        else if (error instanceof PatternPartiallyMatching) match = null
      }

      // in the case of partial application, return null
      return match === null ? null : branch(match)
    }

    if (alternativeBranch !== null)
      return alternativeBranch()

    throw new NonExhaustivePatterns('Non-exhaustive patterns')
  }
}
