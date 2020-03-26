import { TypeInterface } from './TypeInterface'

const BASIC_TYPE = Object.freeze('BasicType')

export class BasicType implements TypeInterface {
  matches = (pattern: TypeInterface): boolean => pattern instanceof BasicType
  isValid = (): boolean => true
  toString = (): string => BASIC_TYPE
}
