const UTILS_MODULE = 'codeGeneration'
const CURRY_FUNCTION = `${UTILS_MODULE}.curry`
const RESOLVE_ABSTRACTION_BRANCH_FUNCTION = `${UTILS_MODULE}.resolveAbstractionBranch`
const ARGUMENTS_NAME = 'args'

const resolveAbstractionBranch = (branches: string[]) => {
  const joinedBranches = branches.join(',')
  return `${RESOLVE_ABSTRACTION_BRANCH_FUNCTION}(${ARGUMENTS_NAME},[${joinedBranches}])`
}

const curry = (fn: string) =>
  `${CURRY_FUNCTION}((...${ARGUMENTS_NAME}) => ${fn})`

export const generateAbstraction = (branches: string[]): string =>
  curry(resolveAbstractionBranch(branches))
