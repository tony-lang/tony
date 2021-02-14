const INDENT = '  '

/**
 * Indents a multiline string by a given number of levels and pads it with
 * newlines.
 */
export const indent = (value: string, level = 1): string => {
  const indentedValue = value
    .split('\n')
    .map((line) => (line !== '' ? `${INDENT.repeat(level)}${line}` : ''))
    .join('\n')
  return `\n${indentedValue}\n`
}
