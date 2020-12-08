import path from 'path'

export const FILE_EXTENSION = '.tn'
export const TARGET_FILE_EXTENSION = '.js'
export const FILE_EXTENSION_REGEX = new RegExp(
  `^(.+\\${FILE_EXTENSION}|[^.]+)$`,
)
export const JAVASCRIPT_FILE_EXTENSION_REGEX = /^.+\.js$/
export const IMPORT_FILE_EXTENSIONS = [
  FILE_EXTENSION_REGEX,
  JAVASCRIPT_FILE_EXTENSION_REGEX,
]

// parser
export const OPERATOR_REGEX = /(==|[!@$%^&*|<>~*\\\-+/.])[!@$%^&*|<>~*\\\-+/.=]*/

// standard library
const STDLIB_PATH = path.join(__dirname, 'stdlib')
export const DEFAULT_IMPORTS = `import * as stdlib from '${STDLIB_PATH}'`

// intermediate representation
export const TRANSFORM_PLACEHOLDER_ARGUMENT =
  '#internal/TRANSFORM_PLACEHOLDER_ARGUMENT'
export const TRANSFORM_IDENTIFIER_PATTERN =
  '#internal/TRANSFORM_IDENTIFIER_PATTERN'
export const TRANSFORM_REST_PATTERN = '#internal/TRANSFORM_REST_PATTERN'
