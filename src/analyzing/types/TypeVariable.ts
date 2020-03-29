import { CurriedType } from './CurriedType'
import { Type } from './Type'
import { UnificationError } from './UnificationError'

export class TypeVariable extends Type {
  private static unnamedVariableCount = 0

  private _name: string

  constructor(name?: string) {
    super(false)

    this._name = name || TypeVariable.getUnusedVariableName()
  }

  get name(): string {
    return this._name
  }

  concat = (type: Type): CurriedType => {
    if (type instanceof CurriedType) return type.concat(this)

    return new CurriedType([this, type])
  }

  unify = (type: Type): Type => {
    if (!(type instanceof TypeVariable)) return type
    if (this.name !== type.name)
      throw new UnificationError(this, type, 'Type variables do not match')

    return this
  }

  isComplete = (): boolean => false

  toString = (): string => `${this.name}`

  private static getUnusedVariableName = (): string => {
    const name = `t${TypeVariable.unnamedVariableCount}`
    TypeVariable.unnamedVariableCount += 1

    return name
  }
}
