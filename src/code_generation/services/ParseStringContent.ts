export class ParseStringContent {
  static perform = (text: string, qt = '`'): string => {
    // removes on escape when there are an even number of escapes before a qt
    // inside a string
    const regex = new RegExp(`(?<!\\\\)(\\\\\\\\)+(?!\\\\)(?=${qt})`, 'g')

    return text
      .slice(1, -1)
      .replace(new RegExp(qt, 'g'), `\\${qt}`)
      .replace(regex, (s) => s.substring(1))
  }
}
