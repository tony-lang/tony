import {
  ApplicationNode,
  IdentifierNode,
  InfixApplicationNode,
  PipelineNode,
  PrefixApplicationNode,
} from 'tree-sitter-tony'
import { ObjectScope } from '../analyze/scopes'

// ---- Types ----

enum TypeKind {
  Alias,
  Object,
  Parametric,
  Primitive,
  Refined,
  Variable,
}

/**
 * A type variable represents any type.
 */
export interface TypeVariable {
  kind: typeof TypeKind.Variable
}

/**
 * A type alias represents an existing type under a new name.
 */
export interface TypeAlias {
  kind: typeof TypeKind.Alias
  name: string
  type: Type
}

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
 * An object type represents the scope of an object (e.g. its properties).
 */
export interface ObjectType extends ObjectScope {
  kind: typeof TypeKind.Object
}

export enum PrimitiveTypeName {
  Boolean,
  Number,
  RegExp,
  String,
  /**
   * The type of operations that do not return anything.
   */
  Void,
}

export interface PrimitiveType {
  kind: typeof TypeKind.Primitive
  name: PrimitiveTypeName
}

export type Type =
  | TypeVariable
  | TypeAlias
  | ParametricType
  | RefinedType
  | ObjectType
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
type TypeVariableAssignment<T extends Type> = {
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

export const buildPrimitiveType = (name: PrimitiveTypeName): PrimitiveType => ({
  kind: TypeKind.Primitive,
  name,
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
