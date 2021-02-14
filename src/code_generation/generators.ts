import { GeneratedPattern, GeneratedPatterns } from './patterns'
import {
  curry,
  patternMatch,
  patternMatchForAbstraction,
  resolveAbstractionBranch,
} from './lib'
import { TRANSFORM_IDENTIFIER_PATTERN } from '../lib/pattern_match'
import { TRANSFORM_PLACEHOLDER_ARGUMENT } from '../lib/curry'
import { UTILS_IMPORT } from '../lib'
import { indent } from './util'

const ARGUMENTS_NAME = '$ARGS'
const INTERNAL_TEMP_TOKEN = '$INTERNAL_TEMP_TOKEN'

export const generateAbstraction = (branches: string[]): string =>
  curry(ARGUMENTS_NAME, resolveAbstractionBranch(ARGUMENTS_NAME, branches))

export const generateAbstractionBranch = (
  [
    parameterPatterns,
    parameterIdentifiersPatterns,
    parameterDefaultsPatterns,
  ]: GeneratedPatterns,
  restParameter: GeneratedPattern | undefined,
  body: string,
): string => {
  const pattern = generateListPattern(
    parameterPatterns,
    restParameter && restParameter[0],
  )
  const identifiersPattern = generateListPattern(
    parameterIdentifiersPatterns,
    restParameter && restParameter[1],
  )
  const defaultsPattern = generateListPattern(
    parameterDefaultsPatterns,
    restParameter && restParameter[2],
  )
  return `[${pattern}, ${defaultsPattern}, ${patternMatchForAbstraction(
    identifiersPattern,
    body,
  )}]`
}

export const generateAccess = (name: string, value: string): string =>
  `${name}[${value}]`

export const generateApplication = (value: string, args: string[]): string => {
  const joinedArgs = args.join(', ')
  return `${value}(${joinedArgs})`
}

export const generateArgument = (value?: string): string =>
  value ? value : `"${TRANSFORM_PLACEHOLDER_ARGUMENT}"`

export const generateAssignment = (
  [pattern, identifiersPattern, defaultsPattern]: GeneratedPattern,
  value: string,
): string => patternMatch(pattern, identifiersPattern, defaultsPattern, value)

export const generateBlock = (
  declarations: string,
  terms: string[],
  endsWithReturn: boolean,
): string => {
  const returnValue = terms.pop()
  const explicitReturn = endsWithReturn ? '' : 'return '
  const joinedTerms = terms.join('\n')
  return `(() => {${indent(
    `${declarations}\n${joinedTerms}\n${explicitReturn}${returnValue}`,
  )}})()`
}

export const generateCase = resolveAbstractionBranch

export const generateEliseIf = (condition: string, body: string): string =>
  ` else if (${condition}) {${indent(`return ${body}`)}}`

export const generateGenerator = (
  name: string,
  value: string,
  condition?: string,
): string =>
  `${value}.map((${name}) => ${
    condition ? `!${condition} ? "${INTERNAL_TEMP_TOKEN}" : ` : ''
  }`

export const generateIdentifierPattern = (): string =>
  `"${TRANSFORM_IDENTIFIER_PATTERN}"`

export const generateIf = (
  condition: string,
  body: string,
  alternativeBodies: string[],
  alternativeBody?: string,
): string => {
  const joinedAlternativeBodies = alternativeBodies.join('')
  return `(() => {if (${condition}) {${indent(
    `return ${body}`,
  )}}${joinedAlternativeBodies}${
    alternativeBody ? ` else {${indent(`return ${alternativeBody}`)}}` : ''
  }})()`
}

export const generateList = (elements: string[]): string =>
  `[${elements.join(', ')}]`

export const generateListComprehension = (
  generators: string[],
  body: string,
): string =>
  `${generators}${body}${')'.repeat(generators.length)}.flat(${
    generators.length - 1
  }).filter((e) => e !== "${INTERNAL_TEMP_TOKEN}")`

export const generateListPattern = (
  elements: string[],
  rest?: string,
): string =>
  rest ? `[${elements.join(', ')}, ...${rest}]` : `[${elements.join(', ')}]`

export const generateMember = (key: string, value: string): string =>
  `[${key}]: ${value}`

export const generateProgram = (
  declarations: string,
  imports: string,
  exports: string,
  terms: string[],
): string => {
  const joinedTerms = terms.join('\n')
  return `${UTILS_IMPORT}\n${imports}\n${declarations}\n${joinedTerms}\n${exports}`
}

export const generateReturn = (value: string): string => `return ${value}`

export const generateShorthandAccessIdentifier = (name: string): string =>
  `'${name}'`

export const generateShorthandMember = (name: string, value: string): string =>
  `${name}: ${value}`

export const generateShorthandMemberPattern = (
  name: string,
  value: string,
): string => `"${name}": "${value}"`

export const generateSpread = (value: string): string => `...${value}`

export const generateString = (content: string): string => `\`${content}\``

export const generateStruct = (members: string[]): string =>
  `{${indent(members.join(',\n'))}}`

export const generateStructPattern = (
  members: string[],
  rest?: string,
): string =>
  rest
    ? `{${indent(`${members.join(',\n')},\n...${rest}`)}}`
    : `{${indent(members.join(',\n'))}}`

export const generateWhen = (
  patterns: GeneratedPattern[],
  body: string,
): string =>
  patterns
    .map(
      ([pattern, identifiersPattern, defaultsPattern]) =>
        `[${pattern},${defaultsPattern},(match) => {${indent(
          `const [${identifiersPattern}] = match\nreturn ${body}`,
        )}}]`,
    )
    .join(',\n')
