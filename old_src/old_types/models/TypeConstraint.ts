import { Type } from './Type'
import { TypeEqualityGraph } from './TypeEqualityGraph'

export class TypeConstraint<T extends Type> {
  private _type: T
  private _typeEqualityGraph: TypeEqualityGraph

  constructor(type: T, typeEqualityGraph = new TypeEqualityGraph()) {
    this._type = type
    this._typeEqualityGraph = typeEqualityGraph
  }

  get type(): T {
    return this._type
  }

  get typeEqualityGraph(): TypeEqualityGraph {
    return this._typeEqualityGraph
  }

  unify = (
    actual: TypeConstraint<Type>,
    ignoreExpectedParameters = false,
  ): TypeConstraint<Type> | undefined => {
    const typeEqualityGraph = TypeEqualityGraph.build(
      this.typeEqualityGraph,
      actual.typeEqualityGraph,
    )
    if (typeEqualityGraph === undefined) return

    const type = this.type
      .unify(actual.type, typeEqualityGraph, ignoreExpectedParameters)
      ?.reduce(typeEqualityGraph)

    if (type) return new TypeConstraint(type, typeEqualityGraph)
  }

  toString = (): string =>
    `${this.type.toString()}${this.typeEqualityGraph.toString()}`

  static build = <T extends Type>(
    type?: T,
    typeEqualityGraph = new TypeEqualityGraph(),
  ): TypeConstraint<T> | undefined => {
    if (type === undefined) return

    return new TypeConstraint(type, typeEqualityGraph)
  }
}
