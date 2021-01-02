import {
  ApplicationNode,
  IdentifierNode,
  InfixApplicationNode,
  PipelineNode,
  PrefixApplicationNode,
  SyntaxNode,
} from 'tree-sitter-tony'
import { PrimitiveType } from './primitive_types'
import { TypedObjectScope } from '../analyze/scopes'

// ---- Types ----

export enum TypeKind {
  Curried,
  Generic,
  Intersection,
  Map,
  Object,
  Parametric,
  Refined,
  Tagged,
  Union,
  Variable,

  // Literals
  Boolean,
  Number,
  RegExp,
  String,
  Void,
}

/**
 * A type variable represents any type.
 */
export type TypeVariable = {
  kind: typeof TypeKind.Variable
}

/**
 * A curried type represents an abstraction parametrized by the `from` type and
 * returning the `to` type.
 */
export type CurriedType = {
  kind: typeof TypeKind.Curried
  from: Type
  to: Type
}

/**
 * A generic type represents a type that may depend on other types.
 */
export type GenericType = {
  kind: typeof TypeKind.Generic
  name: string
  typeParameters: Type[]
}

/**
 * A parametric type represents a concrete instance of a parametric type.
 */
export type ParametricType = {
  kind: typeof TypeKind.Parametric
  name: string
  typeArguments: Type[]
  termArguments: SyntaxNode[]
}

/**
 * A refined type represents a type alongside some predicates on values of that
 * type.
 */
export type RefinedType = {
  kind: typeof TypeKind.Refined
  type: Type
  predicates: TypePredicate[]
}

/**
 * A tagged type represents a type alongside a tag used to construct values of
 * that type.
 */
export type TaggedType = {
  kind: typeof TypeKind.Tagged
  tag: string
  type: Type
}

/**
 * An object type represents the scope of an object (e.g. its properties).
 */
export type ObjectType = TypedObjectScope & {
  kind: typeof TypeKind.Object
}

/**
 * A map type represents the scope of a mapping from values of a key type to
 * values of a value type.
 */
export type MapType = {
  kind: typeof TypeKind.Map
  key: Type
  value: Type
}

/**
 * A union type represents the type of any of its parameters.
 */
export type UnionType = {
  kind: typeof TypeKind.Union
  parameters: Type[]
}

/**
 * An intersection type represents all types that can be assigned to all of its
 * parameters.
 */
export type IntersectionType = {
  kind: typeof TypeKind.Intersection
  parameters: Type[]
}

export type Type =
  | TypeVariable
  | CurriedType
  | GenericType
  | ParametricType
  | TaggedType
  | RefinedType
  | ObjectType
  | MapType
  | UnionType
  | IntersectionType
  | PrimitiveType

/**
 * A constrained type represents a type alongside constraints on type variables.
 */
export type ConstrainedType<T extends Type> = {
  type: T
  constraints: TypeConstraints
}

/**
 * A set of assignments of type variables to their most general type.
 */
export type TypeConstraints = TypeVariableAssignment<Type>[]

/**
 * Maps a type variable to its most general type.
 */
export type TypeVariableAssignment<T extends Type> = {
  typeVariable: TypeVariable
  type: T
}

/**
 * Stores a predicate on a type.
 */
type TypePredicate = {
  node:
    | ApplicationNode
    | IdentifierNode
    | InfixApplicationNode
    | PipelineNode
    | PrefixApplicationNode
}

// ---- Factories ----

export const buildTypeVariable = (): TypeVariable => ({
  kind: TypeKind.Variable,
})

export const buildCurriedType = (from: Type, to: Type): CurriedType => ({
  kind: TypeKind.Curried,
  from,
  to,
})

export const buildGenericType = (
  name: string,
  typeParameters: Type[],
): GenericType => ({
  kind: TypeKind.Generic,
  name,
  typeParameters,
})

export const buildParametricType = (
  name: string,
  typeArguments: Type[],
  termArguments: SyntaxNode[],
): ParametricType => ({
  kind: TypeKind.Parametric,
  name,
  typeArguments,
  termArguments,
})

export const buildIntersectionType = (
  parameters: Type[] = [],
): IntersectionType => ({
  kind: TypeKind.Intersection,
  parameters,
})

export const buildUnionType = (parameters: Type[] = []): UnionType => ({
  kind: TypeKind.Union,
  parameters,
})

export const buildConstrainedType = <T extends Type>(
  type: T,
  constraints: TypeConstraints = [],
): ConstrainedType<T> => ({
  type,
  constraints,
})

export const buildTypeConstraints = (
  constraints: TypeVariableAssignment<Type>[] = [],
): TypeConstraints => constraints
