import path from 'path'

export const FILE_EXTENSION = Object.freeze('.tn')
export const TARGET_FILE_EXTENSION = Object.freeze('.js')
export const FILE_EXTENSION_REGEX = Object.freeze(
  new RegExp(`^(.+\\${FILE_EXTENSION}|[^.]+)$`),
)
export const JAVASCRIPT_FILE_EXTENSION_REGEX = Object.freeze(/^.+\.js$/)
export const IMPORT_FILE_EXTENSIONS = Object.freeze([
  FILE_EXTENSION_REGEX,
  JAVASCRIPT_FILE_EXTENSION_REGEX,
])

// parser
export const OPERATOR_REGEX = Object.freeze(
  /(==|[!@$%^&*|<>~*\\\-+/.])[!@$%^&*|<>~*\\\-+/.=]*/,
)

// standard library
const STDLIB_PATH = Object.freeze(path.join(__dirname, 'stdlib'))
export const DEFAULT_IMPORTS = Object.freeze(
  `import * as stdlib from '${STDLIB_PATH}'`,
)

// intermediate representation
export const TRANSFORM_PLACEHOLDER_ARGUMENT = Object.freeze(
  '#internal/TRANSFORM_PLACEHOLDER_ARGUMENT',
)
export const TRANSFORM_IDENTIFIER_PATTERN = Object.freeze(
  '#internal/TRANSFORM_IDENTIFIER_PATTERN',
)
export const TRANSFORM_REST_PATTERN = Object.freeze(
  '#internal/TRANSFORM_REST_PATTERN',
)
