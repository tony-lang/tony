import { TypeInterface } from './TypeInterface'

export const MISSING_TYPE_REPR: string = null
const MISSING_TYPE_NAME = Object.freeze('MISSING_TYPE')

export class Type implements TypeInterface {
  private _name: string

  constructor(name: string) {
    this._name = name
  }

  matches = (pattern: TypeInterface): boolean => {
    if (!(pattern instanceof Type)) return false

    return pattern.name === MISSING_TYPE_REPR || this.name === pattern.name
  }

  isValid = (): boolean => this.name !== MISSING_TYPE_REPR

  toString = (): string => this.isValid() ? this.name : MISSING_TYPE_NAME

  get name(): string {
    return this._name
  }
}
