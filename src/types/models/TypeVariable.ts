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

  unify = (actual: Type, constraints: TypeConstraints): Type =>
    this._unify(actual, constraints)._reduce(constraints)

  _unify = (actual: Type, constraints: TypeConstraints): Type => {
    if (!(actual instanceof TypeVariable)) {
      constraints.add(this, actual)
      return actual
    }

    if (this.name !== actual.name) constraints.add(actual, this)
    return this
  }

  _reduce = (constraints: TypeConstraints): Type => {
    if (constraints.has(this)) return constraints.resolve(this)!

    return this
  }

  toString = (): string => this.name

  private static getUnusedVariableName = (): string => {
    const name = `t${TypeVariable.unnamedVariableCount}`
    TypeVariable.unnamedVariableCount += 1

    return name
  }
}
