export const curry = (fn: any, ...cache: any) => (...args: any): any => {
  const all = cache.concat(args)
  return all.length >= fn.length ? fn(...all) : curry(fn, ...all)
}

export const range = curry((start: number, end: number): number[] => {
  if (end < start) return []

  return Array.from({length: (end + 1 - start)}, (v, k) => k + start)
})
