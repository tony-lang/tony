import deepEqual from 'deep-equal'

import {
  TRANSFORM_PLACEHOLDER_ARGUMENT,
  TRANSFORM_REST,
  TRANSFORM_IDENTIFIER_PATTERN
} from '../constants'

const getActualArgs = (args: any[]): any[] => args.filter(arg => arg !== null)

const addNewArgs = (args: any[], newArgs: any[]): any[] => args
  .map(arg => arg === TRANSFORM_PLACEHOLDER_ARGUMENT ? newArgs.pop() : arg)
  .concat(newArgs)

export const curry = (fn: any, ...cache: any[]) => (...args: any[]): any => {
  const newArgs = addNewArgs(cache, args)
  const actualArgs = getActualArgs(newArgs)

  return actualArgs.length >= fn.length ?
    fn(...actualArgs) : curry(fn, ...newArgs)
}

export const patternMatch = (pattern: any, value: any): any[] => {
  if (pattern === TRANSFORM_IDENTIFIER_PATTERN)
    return [value]
  else if (typeof pattern !== 'object' && deepEqual(pattern, value))
    return []
  else if (Array.isArray(pattern) && Array.isArray(value))
    return pattern.slice(0).reduce((result, element, i, arr) => {
      if (element === TRANSFORM_REST) {
        arr.splice(i - 1)
        return result.concat([value.slice(i)])
      }

      return result.concat(patternMatch(element, value[i]))
    }, [])
  else if (typeof pattern === 'object' && !Array.isArray(pattern) && typeof value === 'object' && !Array.isArray(value))
    return Object.entries(pattern).slice(0).reduce((result, [key, element], i, arr) => {
      if (key === TRANSFORM_REST) {
        arr.splice(i - 1)
        return result.concat([value])
      }

      const newResult = result.concat(patternMatch(element, value[key]))
      delete value[key]
      return newResult
    }, [])
  else
    throw 'Pattern does not match'
}
