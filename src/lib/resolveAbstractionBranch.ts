import {
  PatternNotMatching,
  PatternPartiallyMatching,
  patternMatch,
} from './patternMatch'

class NonExhaustivePatterns extends Error {
  constructor(message: string) {
    super(
      `${message} This is a runtime error that should not occur, but instead caught at compile time.`,
    )
    this.name = this.constructor.name
  }
}

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
      if (error instanceof PatternNotMatching) continue
      else if (error instanceof PatternPartiallyMatching) match = undefined
    }

    // in the case of partial application, return undefined
    return match === undefined ? undefined : branch(match)
  }

  if (alternativeBranch) return alternativeBranch()

  throw new NonExhaustivePatterns('Non-exhaustive patterns.')
}
