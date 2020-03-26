import { TypeConstructor } from "./TypeConstructor";
import { TypeInterface } from "./TypeInterface";

export class ListType extends TypeInterface {
  private _type: TypeConstructor

  constructor(type: TypeConstructor) {
    super()

    this._type = type
  }

  isValid = (): boolean => this._type.isValid()

  toString = (): string => `[${this._type.toString()}]`
}
