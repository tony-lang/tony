import deepEqual from 'deep-equal'

export const TRANSFORM_IDENTIFIER_PATTERN = '$TRANSFORM_IDENTIFIER_PATTERN'

export class PatternNotMatching extends Error {
  constructor(message: string) {
    super(
      `${message} This is a runtime error that should not occur, but instead caught at compile time.`,
    )
    this.name = this.constructor.name
  }
}

export class PatternPartiallyMatching extends Error {
  constructor(message: string) {
    super(
      `${message} This is a runtime error that should not occur, but instead caught at compile time.`,
    )
    this.name = this.constructor.name
  }
}

type PatternMatchConfig = {
  readonly defaults: unknown[]
  /**
   * Allow fewer arguments than pattern demands.
   */
  readonly allowFewerArguments: boolean
  /**
   * Allow more arguments than pattern demands
   */
  readonly allowMoreArguments: boolean
}

export const patternMatch = (
  config: PatternMatchConfig,
  pattern: unknown,
  value: unknown,
  depth = 0,
): unknown[] => {
  if (pattern === TRANSFORM_IDENTIFIER_PATTERN)
    return patternMatchIdentifier(config, value, depth)
  else if (typeof pattern !== 'object' && deepEqual(pattern, value)) return []
  else if (Array.isArray(pattern) && Array.isArray(value))
    return patternMatchArray(config, pattern, value, depth)
  else if (
    typeof pattern === 'object' &&
    pattern !== null &&
    typeof value === 'object' &&
    value !== null
  )
    return patternMatchObject(config, pattern, value, depth)
  else if (omitsPattern(config, pattern, value))
    return patternMatchOmittedPattern(config, pattern)
  else throw new PatternNotMatching('Pattern does not match.')
}

const patternMatchIdentifier = (
  config: PatternMatchConfig,
  value: unknown,
  depth: number,
): unknown[] => {
  const defaultValue = config.defaults.shift()

  if (value === undefined)
    if (defaultValue === undefined)
      if (config.allowFewerArguments && depth == 1)
        throw new PatternPartiallyMatching('Pattern does only partially match.')
      else throw new PatternNotMatching('Pattern does not match.')
    else return [value || defaultValue]
  else return [value]
}

const patternMatchArray = (
  config: PatternMatchConfig,
  patterns: Array<unknown>[],
  arr: Array<unknown>[],
  depth: number,
): unknown[][] => {
  if (!config.allowMoreArguments && tooManyArgumentsForArray(patterns, arr))
    throw new PatternNotMatching('Pattern does not match.')

  return patterns.slice(0).reduce<unknown[][]>((acc, pattern, i, tmp) => {
    if (isRestPattern(pattern)) {
      tmp.splice(i - 1)
      return acc.concat([arr.slice(i)])
    }

    return acc.concat(patternMatch(config, pattern, arr[i], depth + 1))
  }, [])
}

const patternMatchObject = (
  config: PatternMatchConfig,
  patterns: object,
  obj: Partial<Record<string, unknown>>,
  depth: number,
): unknown[] => {
  if (!config.allowMoreArguments && tooManyArgumentsForObject(patterns, obj))
    throw new PatternNotMatching('Pattern does not match')

  const tmpObj = { ...obj }
  return Object.entries(patterns).reduce(
    (acc: unknown[], [key, pattern], i, tmp) => {
      if (isRestPattern(key)) {
        tmp.splice(i - 1)
        return acc.concat([tmpObj])
      }

      delete tmpObj[key]
      return acc.concat(patternMatch(config, pattern, obj[key], depth + 1))
    },
    [],
  )
}

const omitsPattern = (
  config: PatternMatchConfig,
  pattern: unknown,
  value: unknown,
): boolean => value === undefined && isOmittable(config, pattern)

const isOmittable = (config: PatternMatchConfig, pattern: unknown): boolean => {
  const identifierPatternsCount = getIdentifierPatternsCount(pattern)

  return (
    config.defaults.length >= identifierPatternsCount &&
    config.defaults
      .slice(identifierPatternsCount - 1)
      .every((defaultValue) => defaultValue !== undefined)
  )
}

const patternMatchOmittedPattern = (
  config: PatternMatchConfig,
  pattern: unknown,
): unknown[] => config.defaults.splice(0, getIdentifierPatternsCount(pattern))

const getIdentifierPatternsCount = (pattern: unknown): number => {
  if (pattern === TRANSFORM_IDENTIFIER_PATTERN) return 1
  else if (Array.isArray(pattern))
    return pattern.reduce((acc, value) => {
      return acc + getIdentifierPatternsCount(value)
    }, 0)
  else if (typeof pattern === 'object' && pattern !== null)
    return Object.entries(pattern).reduce((acc, [, value]) => {
      return acc + getIdentifierPatternsCount(value)
    }, 0)
  else return 0
}

const tooManyArgumentsForArray = (
  patterns: Array<unknown>[],
  arr: Array<unknown>[],
): boolean => !patterns.some(isRestPattern) && patterns.length < arr.length

const tooManyArgumentsForObject = (patterns: object, obj: object): boolean =>
  !Object.keys(patterns).some(isRestPattern) &&
  Object.entries(patterns).length < Object.entries(obj).length

const isRestPattern = (pattern: unknown) =>
  typeof pattern === 'string' && pattern.startsWith('...')
