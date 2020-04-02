import path from 'path'

export const FILE_EXTENSION = Object.freeze('.tn')
export const TARGET_FILE_EXTENSION = Object.freeze('.js')

// parser
export const OPERATOR_REGEX = Object.freeze(
  /(==|[!@$%^&*|<>~*\\\-+/.])[!@$%^&*|<>~*\\\-+/.=]*/,
)
export const NODE_TYPES_WITH_DEFAULT_VALUES = Object.freeze([
  'pattern',
  'shorthand_pair_identifier_pattern',
])
export const DESTRUCTURING_PATTERN_NODE_TYPES = Object.freeze([
  'list_pattern',
  'tuple_pattern',
  'map_pattern',
])

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
