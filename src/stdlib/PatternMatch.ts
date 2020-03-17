import deepEqual from 'deep-equal'

import {
  TRANSFORM_REST_PATTERN,
  TRANSFORM_IDENTIFIER_PATTERN
} from '../constants'

export class PatternMatch {
  static perform = (pattern: any, value: any): any[] => {
    if (PatternMatch.matchesIdentifier(pattern))
      return [value]
    else if (PatternMatch.matchesLiteral(pattern, value))
      return []
    else if (PatternMatch.matchesArray(pattern, value))
      return PatternMatch.patternMatchArray(pattern, value)
    else if (PatternMatch.matchesObject(pattern, value))
      return PatternMatch.patternMatchObject(pattern, value)
    else
      throw 'Pattern does not match'
  }

  private static patternMatchArray = (patterns: any[], arr: any[]): any[][] => {
    return patterns.slice(0).reduce((result, pattern, i, tmp) => {
      if (pattern === TRANSFORM_REST_PATTERN) {
        tmp.splice(i - 1)
        return result.concat([arr.slice(i)])
      }

      return result.concat(PatternMatch.perform(pattern, arr[i]))
    }, [])
  }

  private static patternMatchObject = (patterns: any, obj: any): any[] => {
    const tmpObj = {...obj}

    return Object.entries(patterns)
      .reduce((result, [key, pattern], i, arr) => {
        if (key === TRANSFORM_REST_PATTERN) {
          arr.splice(i - 1)
          return result.concat([tmpObj])
        }

        delete tmpObj[key]
        return result.concat(PatternMatch.perform(pattern, obj[key]))
      }, [])
  }

  private static matchesIdentifier = (pattern: any): boolean =>
    pattern === TRANSFORM_IDENTIFIER_PATTERN

  private static matchesLiteral = (pattern: any, value: any): boolean =>
    typeof pattern !== 'object' && deepEqual(pattern, value)

  private static matchesArray = (pattern: any, value: any): boolean =>
    Array.isArray(pattern) && Array.isArray(value)

  private static matchesObject = (pattern: any, value: any): boolean =>
    typeof pattern === 'object' && !Array.isArray(pattern) &&
    typeof value === 'object' && !Array.isArray(value)
}
