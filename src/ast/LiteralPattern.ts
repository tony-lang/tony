import { Boolean } from './Boolean'
import { Number } from './Number'
import { ParametricType } from './ParametricType'
import { Regex } from './Regex'
import { StringPattern } from './StringPattern'

export type LiteralPattern =
  // eslint-disable-next-line @typescript-eslint/ban-types
  | Boolean
  // eslint-disable-next-line @typescript-eslint/ban-types
  | Number
  | ParametricType
  | Regex
  | StringPattern
