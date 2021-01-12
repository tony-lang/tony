export const isNotUndefined = <T>(value: T | undefined): value is T =>
  value !== undefined

export const filterUnique = <T>(list: T[]): T[] =>
  list.filter((item, index) => list.indexOf(item) === index)
