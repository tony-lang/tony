import { AtomicType, VOID_TYPE } from '.'
import { CurriedTypeConstructor } from './CurriedTypeConstructor'
import { ListType } from './ListType'
import { Type } from './Type'
import { TypeConstructor } from './TypeConstructor'
import { TypeInterface } from './TypeInterface'

export class SingleTypeConstructor extends TypeConstructor {
  private _type: AtomicType

  constructor(type: AtomicType, isOptional = false) {
    super(isOptional)

    this._type = type
  }

  get type(): AtomicType {
    return this._type
  }

  get length(): number {
    return 1
  }

  concat = (
    typeConstructor: TypeConstructor,
    merge = true
  ): CurriedTypeConstructor => {
    if (typeConstructor instanceof SingleTypeConstructor)
      return new CurriedTypeConstructor([this, typeConstructor])
    else if (typeConstructor instanceof CurriedTypeConstructor)
      return typeConstructor.concat(this, merge)
  }

  matches = (pattern: TypeInterface): boolean => {
    if (!(pattern instanceof SingleTypeConstructor)) return false

    return this.type.matches(pattern.type)
  }

  isComplete = (): boolean => this.type.isComplete()

  isValid = (): boolean => {
    if (this.type instanceof SingleTypeConstructor && this.type.type instanceof Type && this.type.type.name === VOID_TYPE) return false
    if (this.type instanceof SingleTypeConstructor &&
        this.type.type instanceof ListType &&
        this.type.type.isRest) return false

    return this.type.isValid()
  }

  toString = (): string => {
    if (this.type instanceof TypeConstructor)
      return `(${this.type.toString()})${this.isOptional ? '?' : ''}`
    else
      return `${this.type.toString()}${this.isOptional ? '?' : ''}`
  }
}
