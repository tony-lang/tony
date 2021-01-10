import { Literal, PrimitiveType } from './primitive_types'
import {
  Predicate,
  buildBindingValue,
  buildEqualityPredicate,
  buildLiteralValue,
} from './predicates'
import { SyntaxNode } from 'tree-sitter-tony'
import { TermBinding } from '../analyze/bindings'

// ---- Types ----

export enum TypeKind {
  Access,
  Conditional,
  Curried,
  Generic,
  Intersection,
  Map,
  Object,
  Parametric,
  Refined,
  RefinedTerm,
  Subtraction,
  Tagged,
  Term,
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
export interface TypeVariable {
  kind: typeof TypeKind.Variable
}

/**
 * A curried type represents an abstraction parametrized by the `from` type and
 * returning the `to` type.
 */
export interface CurriedType<T extends Type> {
  kind: typeof TypeKind.Curried
  from: T
  to: T
}

/**
 * A generic type represents a type that may depend on other types.
 */
export interface GenericType {
  kind: typeof TypeKind.Generic
  name: string
  typeParameters: TypeVariable[]
}

/**
 * A parametric type represents a concrete instance of an unresolved parametric
 * type.
 */
export interface ParametricType {
  kind: typeof TypeKind.Parametric
  name: string
  typeArguments: UnresolvedType[]
  termArguments: SyntaxNode[]
}

/**
 * A term type represents an unresolved type of a node (resulting from
 * typeof's).
 */
export interface TermType {
  kind: typeof TypeKind.Term
  binding: TermBinding
}

/**
 * A refined type represents a type alongside some predicates on values of that
 * type.
 */
export interface RefinedType<T extends Type> {
  kind: typeof TypeKind.Refined
  type: T
  predicates: Predicate[]
}

/**
 * A refined term represents a term binding nested within a refined type
 * constrained by predicates.
 */
export interface RefinedTerm {
  kind: typeof TypeKind.RefinedTerm
  name: string
}

/**
 * A property represents the mapping of a key to a value.
 */
export type Property<T extends Type, U extends Type> = {
  key: T
  value: U
}

/**
 * An object type represents the scope of an object (e.g. its properties).
 */
export interface ObjectType<T extends Type, U extends Type> {
  kind: typeof TypeKind.Object
  properties: Property<T, U>[]
}

/**
 * A map type represents the scope of a mapping from values of a key type to
 * values of a value type.
 */
export interface MapType<T extends Type, U extends Type> {
  kind: typeof TypeKind.Map
  property: Property<T, U>
}

/**
 * A union type represents the type of any of its parameters.
 */
export interface UnionType<T extends Type> {
  kind: typeof TypeKind.Union
  parameters: T[]
}

/**
 * An intersection type represents all types that can be assigned to all of its
 * parameters.
 */
export interface IntersectionType<T extends Type> {
  kind: typeof TypeKind.Intersection
  parameters: T[]
}

/**
 * An access type reduces to the type a property of an object type maps to.
 */
export interface AccessType {
  kind: typeof TypeKind.Access
  type: UnresolvedType
  property: UnresolvedType
}

/**
 * A conditional type reduces to one of two types depending on whether a given
 * type fulfills some constraints.
 */
export interface ConditionalType {
  kind: typeof TypeKind.Conditional
  type: UnresolvedType
  constraints: UnresolvedType[]
  consequence: UnresolvedType
  alternative: UnresolvedType
}

/**
 * A subtraction type reduces to the union including all members of the left
 * union that do not appear in the right union.
 */
export interface SubtractionType {
  kind: typeof TypeKind.Subtraction
  left: UnresolvedType
  right: UnresolvedType
}

export type DeclaredType = TypeVariable | GenericType
export type UnresolvedType =
  | TypeVariable
  | CurriedType<UnresolvedType>
  | RefinedType<UnresolvedType>
  | RefinedTerm
  | ObjectType<UnresolvedType, UnresolvedType>
  | MapType<UnresolvedType, UnresolvedType>
  | UnionType<UnresolvedType>
  | IntersectionType<UnresolvedType>
  | PrimitiveType
  | AccessType
  | ConditionalType
  | ParametricType
  | SubtractionType
  | TermType
export type ResolvedType =
  | TypeVariable
  | CurriedType<ResolvedType>
  | RefinedType<ResolvedType>
  | RefinedTerm
  | ObjectType<ResolvedType, ResolvedType>
  | MapType<ResolvedType, ResolvedType>
  | UnionType<ResolvedType>
  | IntersectionType<ResolvedType>
  | PrimitiveType
export type Type = UnresolvedType | ResolvedType

// ---- Factories ----

export const buildTypeVariable = (): TypeVariable => ({
  kind: TypeKind.Variable,
})

export const buildCurriedType = <T extends Type>(
  from: T,
  to: T,
): CurriedType<T> => ({
  kind: TypeKind.Curried,
  from,
  to,
})

export const buildGenericType = (
  name: string,
  typeParameters: TypeVariable[],
): GenericType => ({
  kind: TypeKind.Generic,
  name,
  typeParameters,
})

export const buildParametricType = (
  name: string,
  typeArguments: UnresolvedType[],
  termArguments: SyntaxNode[],
): ParametricType => ({
  kind: TypeKind.Parametric,
  name,
  typeArguments,
  termArguments,
})

export const buildTermType = (binding: TermBinding): TermType => ({
  kind: TypeKind.Term,
  binding,
})

export const buildRefinedType = <T extends Type>(
  type: T,
  predicates: Predicate[],
): RefinedType<T> => ({
  kind: TypeKind.Refined,
  type,
  predicates,
})

export const buildRefinedTerm = (name: string): RefinedTerm => ({
  kind: TypeKind.RefinedTerm,
  name,
})

export const buildLiteralType = (value: Literal): RefinedType<RefinedTerm> =>
  buildRefinedType(buildRefinedTerm('value'), [
    buildEqualityPredicate(
      buildBindingValue('value'),
      buildLiteralValue(value),
    ),
  ])

export const buildProperty = <T extends Type, U extends Type>(
  key: T,
  value: U,
): Property<T, U> => ({
  key,
  value,
})

export const buildObjectType = <T extends Type, U extends Type>(
  properties: Property<T, U>[],
): ObjectType<T, U> => ({
  kind: TypeKind.Object,
  properties,
})

export const buildMapType = <T extends Type, U extends Type>(
  property: Property<T, U>,
): MapType<T, U> => ({
  kind: TypeKind.Map,
  property,
})

export const buildIntersectionType = <T extends Type>(
  parameters: T[] = [],
): IntersectionType<T> => ({
  kind: TypeKind.Intersection,
  parameters,
})

export const buildUnionType = <T extends Type>(
  parameters: T[] = [],
): UnionType<T> => ({
  kind: TypeKind.Union,
  parameters,
})

export const buildAccessType = (
  type: UnresolvedType,
  property: UnresolvedType,
): AccessType => ({
  kind: TypeKind.Access,
  type,
  property,
})

export const buildConditionalType = (
  type: UnresolvedType,
  constraints: UnresolvedType[],
  consequence: UnresolvedType,
  alternative: UnresolvedType,
): ConditionalType => ({
  kind: TypeKind.Conditional,
  type,
  constraints,
  consequence,
  alternative,
})

export const buildSubtractionType = (
  left: UnresolvedType,
  right: UnresolvedType,
): SubtractionType => ({
  kind: TypeKind.Subtraction,
  left,
  right,
})
