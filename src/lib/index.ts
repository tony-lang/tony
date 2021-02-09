import path from 'path'

const UTILS_MODULE = '$CODE_GENERATION'
const UTILS_PATH = path.join(__dirname)

export { curry, curryJS } from './curry'
export { patternMatch } from './pattern_match'
export { resolveAbstractionBranch } from './resolve_abstraction_branch'

export const CURRY_UTIL = `${UTILS_MODULE}.curry`
export const CURRY_JS_UTIL = `${UTILS_MODULE}.curryJS`
export const PATTERN_MATCH_UTIL = `${UTILS_MODULE}.patternMatch`
export const RESOLVE_ABSTRACTION_BRANCH_UTIL = `${UTILS_MODULE}.resolveAbstractionBranch`

export const UTILS_IMPORT = `import * as ${UTILS_MODULE} from ${UTILS_PATH}`
