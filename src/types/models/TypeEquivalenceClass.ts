import { Type } from './Type'
import { TypeEqualityGraph } from './TypeEqualityGraph'
import { TypeVariable } from './TypeVariable'

export class TypeEquivalenceClass {
  private _types: Type[]

  constructor(
    typeEqualityGraph: TypeEqualityGraph,
    types: Type[]
  ) {
    this._types = TypeEquivalenceClass.reduce(typeEqualityGraph, types)
  }

  get size(): number {
    return this._types.length
  }

  get types(): Type[] {
    return this._types
  }

  includes = (type: Type): boolean => this._types.some(otherType => type.equals(otherType))

  representative = (
    typeEqualityGraph: TypeEqualityGraph
  ): Type | undefined =>
    TypeEquivalenceClass.buildRepresentative(typeEqualityGraph, this._types)

  toString = (): string =>
    `[${this._types.map((type) => type.toString()).join(', ')}]`

  static unify = (
    typeEqualityGraph: TypeEqualityGraph,
    equivalenceClasses: TypeEquivalenceClass[],
  ): TypeEquivalenceClass =>
    new TypeEquivalenceClass(
      typeEqualityGraph,
      equivalenceClasses.reduce(
        (types: Type[], equivalenceClass) => [
          ...types,
          ...equivalenceClass._types,
        ],
        [],
      ),
    )

  private static reduce = (
    typeEqualityGraph: TypeEqualityGraph,
    types: Type[],
  ): Type[] =>
    types.reduce((types: Type[], type) => {
      if (types.some(otherType => type.equals(otherType))) return types

      TypeEquivalenceClass.buildRepresentative(typeEqualityGraph, types)
      return [...types, type]
    }, [])

  private static buildRepresentative = (
    typeEqualityGraph: TypeEqualityGraph,
    types: Type[],
  ): Type | undefined => {
    const immediateTypes = types.filter(type => !(type instanceof TypeVariable))
    if (immediateTypes.length == 0) return

    console.log(typeEqualityGraph.toString(), immediateTypes.map(t => t.toString()))
    return immediateTypes.reduce((representative: Type, type) =>
      representative.unsafeUnify(type, typeEqualityGraph),
      // representative.unsafeUnify(type),
    ).reduce(typeEqualityGraph)
  }
}
