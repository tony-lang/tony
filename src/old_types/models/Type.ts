import { TypeEqualityGraph } from './TypeEqualityGraph'
import { TypeError } from '../../errors'

export abstract class Type {
  abstract unsafeUnify: (
    actual: Type,
    typeEqualityGraph?: TypeEqualityGraph,
    ignoreExpectedParameters?: boolean,
  ) => Type

  unify = (
    actual: Type,
    typeEqualityGraph?: TypeEqualityGraph,
    ignoreExpectedParameters?: boolean,
  ): Type | undefined =>
    TypeError.safe(() =>
      this.unsafeUnify(actual, typeEqualityGraph, ignoreExpectedParameters),
    )

  abstract reduce: (typeEqualityGraph: TypeEqualityGraph) => Type

  abstract equals: (type: Type) => boolean

  abstract toString: () => string
}
