import { assert } from '../types/errors/internal'

export const parseStringContent = (value: string, qt = '`'): string => {
  const content = value.slice(1, -1)
  // Removes one escape when there are an even number of escapes before a `qt`
  // inside a string.
  const regex = new RegExp(`(?<!\\\\)(\\\\\\\\)+(?!\\\\)(?=${qt})`, 'g')
  return content
    .replace(new RegExp(qt, 'g'), `\\${qt}`)
    .replace(regex, (s) => s.substring(1))
}

export const injectInterpolations = (
  content: string,
  interpolations: string[],
): string =>
  content.replace(/(?<!\\){/g, '${').replace(/(?<=\${).+?(?=})/g, () => {
    const value = interpolations.shift()
    assert(
      value !== undefined,
      'The number of generated interpolations and interpolations in the string should match.',
    )
    return value
  })
