import { TypeKind } from './types'

// ---- Types ----

interface BooleanType {
  kind: typeof TypeKind.Boolean
}

interface NumberType {
  kind: typeof TypeKind.Number
}

interface RegExpType {
  kind: typeof TypeKind.RegExp
}

interface StringType {
  kind: typeof TypeKind.String
}

/**
 * The type of operations that do not return anything.
 */
interface VoidType {
  kind: typeof TypeKind.Void
}

export type PrimitiveType =
  | BooleanType
  | NumberType
  | RegExpType
  | StringType
  | VoidType

// ---- Constants ----

export const BOOLEAN_TYPE: BooleanType = { kind: TypeKind.Boolean }
export const NUMBER_TYPE: NumberType = { kind: TypeKind.Number }
export const REG_EXP_TYPE: RegExpType = { kind: TypeKind.RegExp }
export const STRING_TYPE: StringType = { kind: TypeKind.String }
export const VOID_TYPE: VoidType = { kind: TypeKind.Void }
