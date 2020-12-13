/**
 * Representing a cyclic dependency between a and b with b occurring in the
 * ancestors of a.
 */
export type CyclicDependency<T> = {
  a: T
  b: T
  ancestorsOfA: T[]
}
