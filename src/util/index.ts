export const isNotUndefined = <T>(value: T | undefined): value is T =>
  value !== undefined

export const filterUnique = <T>(list: T[]): T[] =>
  list.filter((item, index) => list.indexOf(item) === index)

export const charCodes = (value: string): number[] =>
  Array(value.length).map((_, i) => value.charCodeAt(i))

export const buildPromise = <T>(value: T): Promise<T> =>
  new Promise((resolve) => resolve(value))
