/**
 * Representing a cyclic dependency between a and b with b occurring in the
 * ancestors of a.
 */
export type CyclicDependency<T> = {
  readonly a: T
  readonly b: T
  readonly ancestorsOfA: T[]
}
