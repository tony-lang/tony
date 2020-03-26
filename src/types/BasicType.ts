import { TypeInterface } from './TypeInterface'

const BASIC_TYPE = Object.freeze('BasicType')

export class BasicType extends TypeInterface {
  isValid = (): boolean => true
  toString = (): string => BASIC_TYPE
}
