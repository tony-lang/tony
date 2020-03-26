import { TypeInterface } from './TypeInterface'

const MISSING_TYPE = Object.freeze('MISSING_TYPE')

export class Type extends TypeInterface {
  private _name: string

  constructor(name: string) {
    super()

    this._name = name
  }

  isValid = (): boolean => this.name !== null

  toString = (): string => this.isValid() ? this.name : MISSING_TYPE

  get name(): string {
    return this._name
  }
}
