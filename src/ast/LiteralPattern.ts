import { Boolean } from './Boolean'
import { Number } from './Number'
import { ParametricType } from './ParametricType'
import { Regex } from './Regex'
import { StringPattern } from './StringPattern'

export type LiteralPattern =
  | Boolean
  | Number
  | ParametricType
  | Regex
  | StringPattern
