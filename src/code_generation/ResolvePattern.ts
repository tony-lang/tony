import {
  TRANSFORM_IDENTIFIER_PATTERN,
  TRANSFORM_REST_PATTERN,
} from '../constants'

import { INTERNAL_TEMP_TOKEN } from './GenerateCode'

export class ResolvePattern {
  static perform = (pattern: string): [string, string[]] => {
    const obj = ResolvePattern.parsePattern(pattern)

    return ResolvePattern.rec(obj)
  }

  private static rec = (obj: any): [string, string[]] => {
    if (
      typeof obj === 'string' &&
      obj.startsWith(INTERNAL_TEMP_TOKEN.repeat(2))
    )
      return ResolvePattern.representRest(obj)
    else if (typeof obj === 'string' && obj.startsWith(INTERNAL_TEMP_TOKEN))
      return ResolvePattern.representIdentifier(obj)
    else if (typeof obj !== 'object')
      return ResolvePattern.representLiteral(obj)
    else if (Array.isArray(obj)) return ResolvePattern.representArray(obj)
    else return ResolvePattern.representObject(obj)
  }

  private static representRest = (obj: any): [string, string[]] => [
    `"${TRANSFORM_REST_PATTERN}"`,
    [obj.substring(2 * INTERNAL_TEMP_TOKEN.length)],
  ]

  private static representIdentifier = (obj: any): [string, string[]] => [
    `"${TRANSFORM_IDENTIFIER_PATTERN}"`,
    [obj.substring(INTERNAL_TEMP_TOKEN.length)],
  ]

  private static representLiteral = (obj: any): [string, string[]] => [
    typeof obj === 'string' ? `'${obj}'` : `${obj}`,
    [],
  ]

  private static representArray = (obj: any[]): [string, string[]] => {
    const [patterns, identifiers] = obj.reduce(
      ([patterns, identifiers], element) => {
        const [newPattern, newIdentifiers] = ResolvePattern.rec(element)

        return [patterns.concat(newPattern), identifiers.concat(newIdentifiers)]
      },
      [[], []],
    )

    return [`[${patterns.join(',')}]`, identifiers]
  }

  private static representObject = (obj: any): [string, string[]] => {
    const [patterns, identifiers] = Object.entries(obj).reduce(
      ([patterns, identifiers]: [string[], string[]], [key, value]) => {
        const [newPattern, newIdentifiers] = ResolvePattern.rec(value)

        return [
          patterns.concat([`${key}:${newPattern}`]),
          identifiers.concat(newIdentifiers),
        ]
      },
      [[], []],
    )

    return [`{${patterns.join(',')}}`, identifiers]
  }

  private static parsePattern = (pattern: string): any => JSON.parse(pattern)
}
