import { CategorizedType, TypeCategory } from './categories'
import { TypeKind } from './types'

// ---- Types ----

type Category = TypeCategory.Resolved | TypeCategory.Unresolved

export type Literal = string | number | boolean | RegExp

type BooleanType<T extends Category = Category> = CategorizedType<T> & {
  kind: typeof TypeKind.Boolean
}

type NumberType<T extends Category = Category> = CategorizedType<T> & {
  kind: typeof TypeKind.Number
}

type RegExpType<T extends Category = Category> = CategorizedType<T> & {
  kind: typeof TypeKind.RegExp
}

type StringType<T extends Category = Category> = CategorizedType<T> & {
  kind: typeof TypeKind.String
}

/**
 * The type of operations that do not return anything.
 */
type VoidType<T extends Category = Category> = CategorizedType<T> & {
  kind: typeof TypeKind.Void
}

export type PrimitiveType<T extends Category = Category> =
  | BooleanType<T>
  | NumberType<T>
  | RegExpType<T>
  | StringType<T>
  | VoidType<T>

// ---- Constants ----

export const BOOLEAN_TYPE: BooleanType = { kind: TypeKind.Boolean }
export const NUMBER_TYPE: NumberType = { kind: TypeKind.Number }
export const REG_EXP_TYPE: RegExpType = { kind: TypeKind.RegExp }
export const STRING_TYPE: StringType = { kind: TypeKind.String }
export const VOID_TYPE: VoidType = { kind: TypeKind.Void }

const BOOLEAN_TYPE_NAME = 'Boolean'
const NUMBER_TYPE_NAME = 'Number'
const REG_EXP_TYPE_NAME = 'RegularExpression'
const STRING_TYPE_NAME = 'String'
const VOID_TYPE_NAME = 'Void'
const PRIMITIVE_TYPE_NAMES: PrimitiveTypeName[] = [
  BOOLEAN_TYPE_NAME,
  NUMBER_TYPE_NAME,
  REG_EXP_TYPE_NAME,
  STRING_TYPE_NAME,
  VOID_TYPE_NAME,
]

type PrimitiveTypeName =
  | typeof BOOLEAN_TYPE_NAME
  | typeof NUMBER_TYPE_NAME
  | typeof REG_EXP_TYPE_NAME
  | typeof STRING_TYPE_NAME
  | typeof VOID_TYPE_NAME

// ---- Factories ----

export const findPrimitiveType = (name: PrimitiveTypeName): PrimitiveType => {
  switch (name) {
    case BOOLEAN_TYPE_NAME:
      return BOOLEAN_TYPE
    case NUMBER_TYPE_NAME:
      return NUMBER_TYPE
    case REG_EXP_TYPE_NAME:
      return REG_EXP_TYPE
    case STRING_TYPE_NAME:
      return STRING_TYPE
    case VOID_TYPE_NAME:
      return VOID_TYPE
  }
}

export const isPrimitiveTypeName = (
  value: string,
): value is PrimitiveTypeName =>
  PRIMITIVE_TYPE_NAMES.includes(value as PrimitiveTypeName)
