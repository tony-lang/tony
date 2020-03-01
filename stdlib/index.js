export const range = (start, end) => {
  if (end < start) return []

  return Array.from({length: (end + 1 - start)}, (v, k) => k + start)
}
