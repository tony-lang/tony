export const curry = (fn: any, ...cache: any) => (...args: any): any => {
  const all = cache.concat(args)
  return all.length >= fn.length ? fn(...all) : curry(fn, ...all)
}

const matchesPattern = (pattern: any, value: any): boolean => {
  const ok = Object.keys, patternType = typeof pattern, valueType = typeof value

  if (pattern && value && patternType === 'object' &&
    patternType === valueType) {
    return ok(pattern).length === ok(value).length &&
      ok(pattern).every(key => matchesPattern(pattern[key], value[key]))
  } else return pattern === value
}

const matchResult = (value: any): any => ({
  case: (): any => matchResult(value),
  else: (): any => value
})

export const match = (value: any): any => ({
  case: (pattern: any, fn: any): any =>
    matchesPattern(pattern, value) ? matchResult(fn(...value)) : match(value),
  else: (fn: any): any => fn(...value)
})

export const range = curry((start: number, end: number): number[] => {
  if (end < start) return []

  return Array.from({length: (end + 1 - start)}, (v, k) => k + start)
})
