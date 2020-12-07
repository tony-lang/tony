import { Type } from './Type'
import { TypeEqualityGraph } from './TypeEqualityGraph'

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

  unsafeUnify = (actual: Type, typeEqualityGraph?: TypeEqualityGraph): Type => {
    if (!(actual instanceof TypeVariable)) {
      if (typeEqualityGraph) typeEqualityGraph.add(this, actual)

      return actual
    }

    if (this.name !== actual.name && typeEqualityGraph)
      typeEqualityGraph.add(actual, this)
    return this
  }

  reduce = (typeEqualityGraph: TypeEqualityGraph): Type =>
    typeEqualityGraph.reduce(this)

  equals = (type: Type): boolean => {
    if (!(type instanceof TypeVariable)) return false

    return this.name === type.name
  }

  toString = (): string => this.name

  private static getUnusedVariableName = (): string =>
    `t${(TypeVariable.unnamedVariableCount += 1)}`
}
