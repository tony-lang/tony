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

export const patternMatch = (parameters: string[], body: string): string =>
  `(match)=>{const [${parameters.join(',')}]=match;return ${body}}`
