import deepEqual from 'deep-equal'

import {
  TRANSFORM_REST_PATTERN,
  TRANSFORM_IDENTIFIER_PATTERN
} from '../constants'

export class PatternNotMatching extends Error {}
export class PatternPartiallyMatching extends Error {}

export class PatternMatch {
  private defaults: any[] = []
  private isStrict = false

  constructor(
    { defaults, isStrict }: { defaults?: any[]; isStrict?: boolean }
  ) {
    if (defaults) this.defaults = defaults
    if (isStrict) this.isStrict = isStrict
  }

  perform = (pattern: any, value: any): any[] => {
    if (PatternMatch.matchesIdentifier(pattern))
      return this.patternMatchIdentifier(value)
    else if (PatternMatch.matchesLiteral(pattern, value))
      return []
    else if (PatternMatch.matchesArray(pattern, value))
      return this.patternMatchArray(pattern, value)
    else if (PatternMatch.matchesObject(pattern, value))
      return this.patternMatchObject(pattern, value)
    else
      throw new PatternNotMatching('Pattern does not match')
  }

  private patternMatchIdentifier = (value: any): any[] => {
    const defaultValue = this.defaults.shift()

    if (this.isStrict && value === undefined && defaultValue === undefined)
      throw new PatternPartiallyMatching('Pattern does only partially match')

    return [value || defaultValue]
  }

  private patternMatchArray = (patterns: any[], arr: any[]): any[][] => {
    return patterns.slice(0).reduce((acc, pattern, i, tmp) => {
      if (pattern === TRANSFORM_REST_PATTERN) {
        tmp.splice(i - 1)
        return acc.concat([arr.slice(i)])
      }

      return acc.concat(this.perform(pattern, arr[i]))
    }, [])
  }

  private patternMatchObject = (patterns: any, obj: any): any[] => {
    const tmpObj = {...obj}

    return Object.entries(patterns)
      .reduce((acc, [key, pattern], i, tmp) => {
        if (key === TRANSFORM_REST_PATTERN) {
          tmp.splice(i - 1)
          return acc.concat([tmpObj])
        }

        delete tmpObj[key]
        return acc.concat(this.perform(pattern, obj[key]))
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
