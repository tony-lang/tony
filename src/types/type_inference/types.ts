import {
  ApplicationNode,
  IdentifierNode,
  InfixApplicationNode,
  PipelineNode,
  PrefixApplicationNode,
} from 'tree-sitter-tony'
import { PrimitiveType } from './primitive_types'
import { TypedObjectScope } from '../analyze/scopes'

// ---- Types ----

export enum TypeKind {
  Intersection,
  NamedVariable,
  Object,
  Parametric,
  Refined,
  Tagged,
  Union,
  UnnamedVariable,

  // Literals
  Boolean,
  Number,
  RegExp,
  String,
  Void,
}

/**
 * Unnamed type variables represent internal type variables not occurring in the
 * code.
 */
interface UnnamedTypeVariable {
  kind: typeof TypeKind.UnnamedVariable
}
/**
 * Named type variables represent a type variable that is given a concrete name
 * in the code..
 */
interface NamedTypeVariable {
  kind: typeof TypeKind.NamedVariable
  name: string
}
/**
 * A type variable represents any type.
 */
export type TypeVariable = UnnamedTypeVariable | NamedTypeVariable

/**
 * A parametric type represents a concrete type that may depend on other types.
 */
export interface ParametricType {
  kind: typeof TypeKind.Parametric
  name: string
  parameters: Type[]
}

/**
 * A refined type represents a type alongside some predicates on values of that
 * type.
 */
export interface RefinedType {
  kind: typeof TypeKind.Refined
  type: Type
  predicates: TypePredicate[]
}

/**
 * A tagged type represents a type alongside a tag used to construct values of
 * that type.
 */
export interface TaggedType {
  kind: typeof TypeKind.Tagged
  tag: string
  type: Type
}

/**
 * An object type represents the scope of an object (e.g. its properties).
 */
export interface ObjectType extends TypedObjectScope {
  kind: typeof TypeKind.Object
}

/**
 * A union type represents the type of any of its parameters.
 */
export interface UnionType {
  kind: typeof TypeKind.Union
  parameters: Type[]
}

/**
 * An intersection type represents all types that can be assigned to all of its
 * parameters.
 */
export interface IntersectionType {
  kind: typeof TypeKind.Intersection
  parameters: Type[]
}

export type Type =
  | TypeVariable
  | ParametricType
  | TaggedType
  | RefinedType
  | ObjectType
  | UnionType
  | IntersectionType
  | PrimitiveType

export type NamedType = NamedTypeVariable | ParametricType | PrimitiveType

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

export const buildUnnamedTypeVariable = (): UnnamedTypeVariable => ({
  kind: TypeKind.UnnamedVariable,
})

export const buildNamedTypeVariable = (name: string): NamedTypeVariable => ({
  kind: TypeKind.NamedVariable,
  name,
})

export const buildParametricType = (
  name: string,
  parameters: Type[] = [],
): ParametricType => ({
  kind: TypeKind.Parametric,
  name,
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
