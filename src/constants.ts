import path from 'path'

export const FILE_EXTENSION = Object.freeze('.tn')
export const TARGET_FILE_EXTENSION = Object.freeze('.js')

export const OPERATOR_REGEX = /(==|[!@$%^&*|<>~*\\\-+/.]+)=*>?/

const STDLIB_PATH = path.join(__dirname, 'stdlib')
export const DEFAULT_IMPORTS =
  Object.freeze(`import * as stdlib from '${STDLIB_PATH}'`)

export const INTERNAL_IDENTIFIER_PREFIX = 'tony_internal_'

export const TRANSFORM_PLACEHOLDER_ARGUMENT =
  '#internal/TRANSFORM_PLACEHOLDER_ARGUMENT'
export const TRANSFORM_IDENTIFIER_PATTERN =
  '#internal/TRANSFORM_IDENTIFIER_PATTERN'
export const TRANSFORM_REST_PATTERN = '#internal/TRANSFORM_REST_PATTERN'
