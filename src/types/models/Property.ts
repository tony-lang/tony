import { Type } from './Type'

export interface Property {
  name: string
  type: Type

  toString(): string
}
