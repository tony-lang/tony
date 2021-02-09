import {
  CURRY_JS_UTIL,
  CURRY_UTIL,
  PATTERN_MATCH_UTIL,
  RESOLVE_ABSTRACTION_BRANCH_UTIL,
} from '../lib'

export const resolveAbstractionBranch = (
  value: string,
  branches: string[],
  elseBranch?: string,
): string => {
  const joinedBranches = branches.join(',')
  return `${RESOLVE_ABSTRACTION_BRANCH_UTIL}(${value},[${joinedBranches}],${
    elseBranch ? `()=>${elseBranch}` : ''
  })`
}

export const curry = (
  argumentsName: string,
  fn: string,
  isJS = false,
): string =>
  `${isJS ? CURRY_JS_UTIL : CURRY_UTIL}((...${argumentsName})=>${fn})`

export const patternMatchForAbstraction = (
  parameters: string,
  value: string,
): string => `(match)=>{const ${parameters}=match;return ${value}}`

export const patternMatch = (
  pattern: string,
  identifiers: string,
  defaults: string,
  value: string,
): string =>
  `(()=>{const value=${value};${identifiers}=${PATTERN_MATCH_UTIL}({defaults:${defaults},allowMoreArguments:true,allowFewerArguments:false},${pattern},value);return value})()`
