// ---- Types ----

/**
 * An answer represents a single "explanation".
 */
export type Answer<T, U> = {
  readonly state: T
} & U

/**
 * Represents a disjunction of multiple "explanations".
 */
export type Answers<T, U> = Answer<T, U>[]

// ---- Factories ----

export const buildAnswer = <T, U>(state: T, value: U): Answer<T, U> => ({
  state,
  ...value,
})
