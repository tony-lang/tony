import {
  CURRY_JS_UTIL,
  CURRY_UTIL,
  PATTERN_MATCH_UTIL,
  RESOLVE_ABSTRACTION_BRANCH_UTIL,
} from '../lib'
import { indent } from './util'

export const resolveAbstractionBranch = (
  value: string,
  branches: string[],
  elseBranch?: string,
): string => {
  const joinedBranches = branches.join(',\n')
  return `${RESOLVE_ABSTRACTION_BRANCH_UTIL}(${value}, [${indent(
    joinedBranches,
  )}],${elseBranch ? ` () => ${elseBranch}` : ''})`
}

export const curry = (
  argumentsName: string,
  fn: string,
  isJS = false,
): string =>
  `${isJS ? CURRY_JS_UTIL : CURRY_UTIL}((...${argumentsName}) => ${fn})`

export const patternMatchForAbstraction = (
  parameters: string,
  value: string,
): string =>
  `(match) => {${indent(`const ${parameters} = match\nreturn ${value}`)}}`

export const patternMatch = (
  pattern: string,
  identifiers: string,
  defaults: string,
  value: string,
): string =>
  `(() => {${indent(
    `const value = ${value}\n${identifiers} = ${PATTERN_MATCH_UTIL}(${indent(
      `{ defaults: ${defaults}, allowMoreArguments: true, allowFewerArguments: false },\n${pattern},\nvalue`,
    )})\nreturn value`,
  )}})()`
