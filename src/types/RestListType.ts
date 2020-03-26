import { ListType } from './ListType'
import { TypeConstructor } from './TypeConstructor'
import { TypeInterface } from './TypeInterface'

export class RestListType implements TypeInterface {
  private _listType: ListType

  constructor(listType: ListType) {
    this._listType = listType
  }

  matches = (pattern: TypeInterface): boolean => {
    if (!(pattern instanceof TypeConstructor)) return false

    return this._listType.matches(new ListType(pattern))
  }

  isValid = (): boolean => this._listType.isValid()

  toString = (): string => `...[${this._listType.toString()}]`
}
