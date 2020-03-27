import { ListType } from './ListType'
import { TypeInterface } from './TypeInterface'

export class RestListType implements TypeInterface {
  private _listType: ListType

  constructor(listType: ListType) {
    this._listType = listType
  }

  matches = (pattern: TypeInterface): boolean => {
    if (!(pattern instanceof RestListType)) return false

    return this._listType.matches(pattern._listType)
  }

  isValid = (): boolean => this._listType.isValid()

  toString = (): string => `...${this._listType.toString()}`
}
