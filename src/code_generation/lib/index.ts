const UTILS_MODULE = 'codeGeneration'
const CURRY_FUNCTION = `${UTILS_MODULE}.curry`
const PATTERN_MATCH_FUNCTION = `${UTILS_MODULE}.patternMatch`
const RESOLVE_ABSTRACTION_BRANCH_FUNCTION = `${UTILS_MODULE}.resolveAbstractionBranch`

export const resolveAbstractionBranch = (
  value: string,
  branches: string[],
  elseBranch?: string,
): string => {
  const joinedBranches = branches.join(',')
  return `${RESOLVE_ABSTRACTION_BRANCH_FUNCTION}(${value},[${joinedBranches}],${
    elseBranch ? `()=>${elseBranch}` : ''
  })`
}

export const curry = (argumentsName: string, fn: string): string =>
  `${CURRY_FUNCTION}((...${argumentsName})=>${fn})`

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
  `(()=>{const value=${value};${identifiers}=${PATTERN_MATCH_FUNCTION}({defaults:${defaults},overmatching:true},${pattern},value);return value})()`
