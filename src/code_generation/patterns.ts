export const resolvePattern = (
  pattern: string,
): [pattern: string, identifiersPattern: string, defaultsPattern: string] => {
  const object = parsePattern(pattern)
}

const parsePattern = (pattern: string): object => JSON.parse(pattern)
