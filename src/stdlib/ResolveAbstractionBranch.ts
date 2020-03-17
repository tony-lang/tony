import { PatternMatch } from './PatternMatch'

export class ResolveAbstractionBranch {
  static perform = (
    args: any,
    branches: [string, (match: any[]) => any][]
  ): any => {
    let match

    for (const [pattern, branch] of branches) {
      try {
        match = PatternMatch.perform(pattern, args)
      } catch {
        // branch pattern does not match arguments, try next branch
        continue
      }

      return branch(match)
    }

    throw 'Non-exhaustive patterns'
  }
}
