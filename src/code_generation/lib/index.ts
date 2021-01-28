const UTILS_MODULE = 'codeGeneration'
const CURRY_FUNCTION = `${UTILS_MODULE}.curry`
const RESOLVE_ABSTRACTION_BRANCH_FUNCTION = `${UTILS_MODULE}.resolveAbstractionBranch`
const ARGUMENTS_NAME = 'args'

export const resolveAbstractionBranch = (branches: string[]): string => {
  const joinedBranches = branches.join(',')
  return `${RESOLVE_ABSTRACTION_BRANCH_FUNCTION}(${ARGUMENTS_NAME},[${joinedBranches}])`
}

export const curry = (fn: string): string =>
  `${CURRY_FUNCTION}((...${ARGUMENTS_NAME})=>${fn})`

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
  `(()=>{const value=${value};${identifiers}=new stdlib.PatternMatch({defaults:${defaults},overmatching:true}).perform(${pattern},value);return value})()`
