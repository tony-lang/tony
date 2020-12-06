import { Boolean } from './Boolean'
import { Number } from './Number'
import { ParametricType } from './ParametricType'
import { Regex } from './Regex'
import { String } from './String'

// eslint-disable-next-line @typescript-eslint/ban-types
export type Literal = Boolean | Number | ParametricType | Regex | String
