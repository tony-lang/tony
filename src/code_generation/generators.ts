import {
  curry,
  patternMatch,
  patternMatchForAbstraction,
  resolveAbstractionBranch,
} from './lib'
import { resolvePattern } from './patterns'

const ARGUMENTS_NAME = 'args'
const INTERNAL_TEMP_TOKEN = '$INTERNAL_TEMP_TOKEN'
const TRANSFORM_PLACEHOLDER_ARGUMENT = '$TRANSFORM_PLACEHOLDER_ARGUMENT'

export const generateAbstraction = (branches: string[]): string =>
  curry(ARGUMENTS_NAME, resolveAbstractionBranch(ARGUMENTS_NAME, branches))

export const generateAbstractionBranch = (
  parameters: string[],
  restParameter: string | undefined,
  body: string,
): string => {
  const [pattern, identifiers, defaults] = resolvePattern(
    restParameter
      ? `[${parameters.join(',')},...${restParameter}]`
      : `[${parameters.join(',')}]`,
  )
  return `[${pattern},${defaults},${patternMatchForAbstraction(
    identifiers,
    body,
  )}]`
}

export const generateAccess = (name: string, value: string): string =>
  `${name}[${value}]`

export const generateApplication = (value: string, args: string[]): string => {
  const joinedArgs = args.join(',')
  return `${value}(${joinedArgs})`
}

export const generateArgument = (value?: string): string =>
  value ? value : `"${TRANSFORM_PLACEHOLDER_ARGUMENT}"`

export const generateAssignment = (pattern: string, value: string): string => {
  const [resolvedPattern, identifiers, defaults] = resolvePattern(pattern)
  return patternMatch(resolvedPattern, identifiers, defaults, value)
}

export const generateBlock = (
  declarations: string,
  terms: string[],
  endsWithReturn: boolean,
): string => {
  const returnValue = terms.pop()
  const explicitReturn = endsWithReturn ? '' : 'return '
  return `(()=>{${declarations};${terms.join(
    ';',
  )};${explicitReturn}${returnValue}})()`
}

export const generateCase = resolveAbstractionBranch

export const generateEliseIf = (condition: string, body: string): string =>
  `else if(${condition}){return ${body}}`

export const generateGenerator = (
  name: string,
  value: string,
  condition?: string,
): string =>
  `${value}.map((${name})=>${
    condition ? `!${condition} ? "${INTERNAL_TEMP_TOKEN}" : ` : ''
  }`

export const generateIdentifierPattern = (name: string): string =>
  `"${INTERNAL_TEMP_TOKEN}${name}"`

export const generateIf = (
  condition: string,
  body: string,
  alternativeBodies: string[],
  alternativeBody?: string,
): string => {
  const joinedAlternativeBodies = alternativeBodies.join('')
  return `(()=>{if(${condition}){return ${body}}${joinedAlternativeBodies}${
    alternativeBody ? `else{return ${alternativeBody}}` : ''
  }})()`
}

export const generateMember = (key: string, value: string): string =>
  `[${key}]:${value}`
