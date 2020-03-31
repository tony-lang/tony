import { CurriedType } from './CurriedType'
import { Type } from './Type'
import { TypeConstraints } from './TypeConstraints'

export class TypeVariable extends Type {
  private static unnamedVariableCount = 0

  private _name: string

  constructor(name?: string) {
    super()

    this._name = name || TypeVariable.getUnusedVariableName()
  }

  get name(): string {
    return this._name
  }

  concat = (type: Type): CurriedType => {
    if (type instanceof CurriedType) return type.concat(this)

    return new CurriedType([this, type])
  }

  unify = (type: Type, constraints: TypeConstraints): Type => {
    if (!(type instanceof TypeVariable)) {
      constraints.add(this, type)
      return type
    }

    if (this.name !== type.name) constraints.add(type, this)
    return this
  }

  applyConstraints = (constraints: TypeConstraints): Type => {
    if (constraints.has(this)) return constraints.resolve(this)

    return this
  }

  isComplete = (): boolean => false

  toString = (): string => this.name

  private static getUnusedVariableName = (): string => {
    const name = `t${TypeVariable.unnamedVariableCount}`
    TypeVariable.unnamedVariableCount += 1

    return name
  }
}
