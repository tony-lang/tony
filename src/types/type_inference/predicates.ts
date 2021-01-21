import { Literal } from './primitive_types'

// ---- Types ----

enum ValueKind {
  Binding,
  Literal,
}

type BindingValue = {
  kind: typeof ValueKind.Binding
  name: string
}

type LiteralValue<T extends Literal> = {
  kind: typeof ValueKind.Literal
  value: T
}

type Value = BindingValue | LiteralValue<Literal>

/**
 * A predicate represents a term relating bindings and literals returning a
 * boolean value.
 */
export type Predicate = {
  name: string
  arguments: Value[]
}

// ---- Constants ----

const EQUALITY_BINDING_NAME = '=='

// ---- Factories ----

export const buildBindingValue = (name: string): BindingValue => ({
  kind: ValueKind.Binding,
  name,
})

export const buildLiteralValue = <T extends Literal>(
  value: T,
): LiteralValue<T> => ({
  kind: ValueKind.Literal,
  value,
})

export const buildEqualityPredicate = (a: Value, b: Value): Predicate => ({
  name: EQUALITY_BINDING_NAME,
  arguments: [a, b],
})
