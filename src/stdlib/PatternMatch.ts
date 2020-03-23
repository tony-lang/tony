import deepEqual from 'deep-equal'

import {
  TRANSFORM_REST_PATTERN,
  TRANSFORM_IDENTIFIER_PATTERN
} from '../constants'

export class PatternNotMatching extends Error {}
export class PatternPartiallyMatching extends Error {}

export class PatternMatch {
  private defaults: any[] = []
  private partialMatching = false // allows fewer arguments than pattern demands
  private overmatching = false // allows more arguments than pattern demands

  constructor(
    { defaults, partialMatching, overmatching }: {
      defaults?: any[];
      partialMatching?: boolean;
      overmatching?: boolean;
    }
  ) {
    if (defaults) this.defaults = defaults
    if (partialMatching) this.partialMatching = partialMatching
    if (overmatching) this.overmatching = overmatching
  }

  perform = (pattern: any, value: any, depth = 0): any[] => {
    if (PatternMatch.matchesIdentifier(pattern))
      return this.patternMatchIdentifier(value, depth)
    else if (PatternMatch.matchesLiteral(pattern, value))
      return []
    else if (PatternMatch.matchesArray(pattern, value))
      return this.patternMatchArray(pattern, value, depth)
    else if (PatternMatch.matchesObject(pattern, value))
      return this.patternMatchObject(pattern, value, depth)
    else if (this.omitsPattern(pattern, value))
      return this.patternMatchOmittedPattern(pattern)
    else
      throw new PatternNotMatching('Pattern does not match')
  }

  private patternMatchIdentifier = (value: any, depth: number): any[] => {
    const defaultValue = this.defaults.shift()

    if (value === undefined)
      if (defaultValue === undefined)
        if (this.partialMatching && depth == 1)
          throw new PatternPartiallyMatching(
            'Pattern does only partially match'
          )
        else
          throw new PatternNotMatching('Pattern does not match')
      else
        return [value || defaultValue]
    else
      return [value]
  }

  private patternMatchArray = (
    patterns: any[],
    arr: any[],
    depth: number
  ): any[][] => {
    if (!this.overmatching && PatternMatch.isOvermatchingArray(patterns, arr))
      throw new PatternNotMatching('Pattern does not match')

    return patterns.slice(0).reduce((acc, pattern, i, tmp) => {
      if (pattern === TRANSFORM_REST_PATTERN) {
        tmp.splice(i - 1)
        return acc.concat([arr.slice(i)])
      }

      return acc.concat(this.perform(pattern, arr[i], depth + 1))
    }, [])
  }

  private patternMatchObject = (
    patterns: any,
    obj: any,
    depth: number
  ): any[] => {
    if (!this.overmatching && PatternMatch.isOvermatchingObject(patterns, obj))
      throw new PatternNotMatching('Pattern does not match')

    const tmpObj = {...obj}
    return Object.entries(patterns)
      .reduce((acc, [key, pattern], i, tmp) => {
        if (key === TRANSFORM_REST_PATTERN) {
          tmp.splice(i - 1)
          return acc.concat([tmpObj])
        }

        delete tmpObj[key]
        return acc.concat(this.perform(pattern, obj[key], depth + 1))
      }, [])
  }

  private omitsPattern = (pattern: any, value: any): boolean =>
    value === undefined && this.isOmittable(pattern)

  private isOmittable = (pattern: any): boolean => {
    const identifierPatternsCount =
      PatternMatch.identifierPatternsCount(pattern)

    return this.defaults.length >= identifierPatternsCount &&
           this.defaults
             .slice(identifierPatternsCount - 1)
             .every(defaultValue => defaultValue !== undefined)
  }

  private patternMatchOmittedPattern = (pattern: any): any[] =>
    this.defaults.splice(0, PatternMatch.identifierPatternsCount(pattern))

  private static matchesIdentifier = (pattern: any): boolean =>
    pattern === TRANSFORM_IDENTIFIER_PATTERN

  private static matchesLiteral = (pattern: any, value: any): boolean =>
    typeof pattern !== 'object' && deepEqual(pattern, value)

  private static matchesArray = (pattern: any, value: any): boolean =>
    Array.isArray(pattern) && Array.isArray(value)

  private static matchesObject = (pattern: any, value: any): boolean =>
    typeof pattern === 'object' && !Array.isArray(pattern) &&
    typeof value === 'object' && !Array.isArray(value)

  private static identifierPatternsCount = (pattern: any): number => {
    if (pattern === TRANSFORM_IDENTIFIER_PATTERN)
      return 1
    else if (Array.isArray(pattern))
      return pattern.reduce((acc, value) => {
        return acc + PatternMatch.identifierPatternsCount(value)
      }, 0)
    else if (typeof pattern === 'object')
      return Object.entries(pattern).reduce((acc, [_, value]) => {
        return acc + PatternMatch.identifierPatternsCount(value)
      }, 0)
    else
      return 0
  }

  private static isOvermatchingArray = (patterns: any[], arr: any[]): boolean =>
    !patterns.includes(TRANSFORM_REST_PATTERN) && patterns.length < arr.length

  private static isOvermatchingObject = (patterns: any, obj: any): boolean =>
    !Object.keys(patterns).includes(TRANSFORM_REST_PATTERN) &&
    Object.entries(patterns).length < Object.entries(obj).length
}
