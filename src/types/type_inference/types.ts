import { Literal, PrimitiveType } from './primitive_types'
import {
  Predicate,
  buildBindingValue,
  buildEqualityPredicate,
  buildLiteralValue,
} from './predicates'
import { SyntaxNode } from 'tree-sitter-tony'
import { TermBinding } from '../analyze/bindings'
import {
  CategorizedType,
  Type,
  TypeCategory,
  UnresolvedType,
} from './categories'

// ---- Types ----

/**
 * A property represents the mapping of a key to a value.
 */
export type Property<T extends Type = Type, U extends Type = Type> = {
  key: T
  value: U
}

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
  TemporaryVariable,
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
 * An access type reduces to the type a property of an object type maps to.
 */
export interface AccessType extends CategorizedType<TypeCategory.Unresolved> {
  kind: typeof TypeKind.Access
  type: UnresolvedType
  property: UnresolvedType
}

/**
 * A conditional type reduces to one of two types depending on whether a given
 * type fulfills some constraints.
 */
export interface ConditionalType
  extends CategorizedType<TypeCategory.Unresolved> {
  kind: typeof TypeKind.Conditional
  type: UnresolvedType
  constraints: UnresolvedType[]
  consequence: UnresolvedType
  alternative: UnresolvedType
}

/**
 * A curried type represents an abstraction parametrized by the `from` type and
 * returning the `to` type.
 */
export interface CurriedType<T extends Type = Type>
  extends CategorizedType<TypeCategory.Resolved | TypeCategory.Unresolved> {
  kind: typeof TypeKind.Curried
  from: T
  to: T
}

/**
 * A generic type represents a type that may depend on other types.
 */
export interface GenericType extends CategorizedType<TypeCategory.Declared> {
  kind: typeof TypeKind.Generic
  name: string
  typeParameters: TypeVariable[]
}

/**
 * An intersection type represents all types that can be assigned to all of its
 * parameters.
 */
export interface IntersectionType<T extends Type = Type>
  extends CategorizedType<TypeCategory.Resolved | TypeCategory.Unresolved> {
  kind: typeof TypeKind.Intersection
  parameters: T[]
}

/**
 * A map type represents the scope of a mapping from values of a key type to
 * values of a value type.
 */
export interface MapType<T extends Type = Type, U extends Type = Type>
  extends CategorizedType<TypeCategory.Resolved | TypeCategory.Unresolved> {
  kind: typeof TypeKind.Map
  property: Property<T, U>
}

/**
 * An object type represents the scope of an object (e.g. its properties).
 */
export interface ObjectType<T extends Type = Type, U extends Type = Type>
  extends CategorizedType<TypeCategory.Resolved | TypeCategory.Unresolved> {
  kind: typeof TypeKind.Object
  properties: Property<T, U>[]
}

/**
 * A parametric type represents a concrete instance of an unresolved parametric
 * type.
 */
export interface ParametricType
  extends CategorizedType<TypeCategory.Unresolved> {
  kind: typeof TypeKind.Parametric
  name: string
  typeArguments: UnresolvedType[]
  termArguments: SyntaxNode[]
}

/**
 * A refined type represents a type alongside some predicates on values of that
 * type.
 */
export interface RefinedType<T extends Type = Type>
  extends CategorizedType<TypeCategory.Resolved | TypeCategory.Unresolved> {
  kind: typeof TypeKind.Refined
  type: T
  predicates: Predicate[]
}

/**
 * A refined term represents a term binding nested within a refined type
 * constrained by predicates.
 */
export interface RefinedTerm
  extends CategorizedType<TypeCategory.Resolved | TypeCategory.Unresolved> {
  kind: typeof TypeKind.RefinedTerm
  name: string
}

/**
 * A subtraction type reduces to the union including all members of the left
 * union that do not appear in the right union.
 */
export interface SubtractionType
  extends CategorizedType<TypeCategory.Unresolved> {
  kind: typeof TypeKind.Subtraction
  left: UnresolvedType
  right: UnresolvedType
}

/**
 * A type variable that is used internally and cannot be related to other types.
 */
export interface TemporaryTypeVariable extends CategorizedType {
  kind: typeof TypeKind.TemporaryVariable
}

/**
 * A term type represents an unresolved type of a node (resulting from
 * typeof's).
 */
export interface TermType extends CategorizedType<TypeCategory.Unresolved> {
  kind: typeof TypeKind.Term
  bindings: TermBinding[]
}

/**
 * A type variable represents any type.
 */
export interface TypeVariable extends CategorizedType {
  kind: typeof TypeKind.Variable
}

/**
 * A union type represents the type of any of its parameters.
 */
export interface UnionType<
  T extends TypeCategory.Resolved | TypeCategory.Unresolved =
    | TypeCategory.Resolved
    | TypeCategory.Unresolved
> extends CategorizedType<T> {
  kind: typeof TypeKind.Union
  parameters: CategorizedType<T>[]
}

// ---- Factories ----

export const buildProperty = <T extends Type, U extends Type>(
  key: T,
  value: U,
): Property<T, U> => ({
  key,
  value,
})

export const buildAccessType = (
  type: Unresolved,
  property: Unresolved,
): AccessType => ({
  kind: TypeKind.Access,
  type,
  property,
})

export const buildConditionalType = (
  type: Unresolved,
  constraints: Unresolved[],
  consequence: Unresolved,
  alternative: Unresolved,
): ConditionalType => ({
  kind: TypeKind.Conditional,
  type,
  constraints,
  consequence,
  alternative,
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

export const buildIntersectionType = <T extends Type>(
  parameters: T[] = [],
): IntersectionType<T> => ({
  kind: TypeKind.Intersection,
  parameters,
})

export const buildMapType = <T extends Type, U extends Type>(
  property: Property<T, U>,
): MapType<T, U> => ({
  kind: TypeKind.Map,
  property,
})

export const buildObjectType = <T extends Type, U extends Type>(
  properties: Property<T, U>[],
): ObjectType<T, U> => ({
  kind: TypeKind.Object,
  properties,
})

export const buildParametricType = (
  name: string,
  typeArguments: Unresolved[],
  termArguments: SyntaxNode[],
): ParametricType => ({
  kind: TypeKind.Parametric,
  name,
  typeArguments,
  termArguments,
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

export const buildSubtractionType = (
  left: Unresolved,
  right: Unresolved,
): SubtractionType => ({
  kind: TypeKind.Subtraction,
  left,
  right,
})

export const buildTemporaryTypeVariable = (): TemporaryTypeVariable => ({
  kind: TypeKind.TemporaryVariable,
})

export const buildTermType = (bindings: TermBinding[]): TermType => ({
  kind: TypeKind.Term,
  bindings,
})

export const buildTypeVariable = (): TypeVariable => ({
  kind: TypeKind.Variable,
})

export const buildUnionType = <T extends Type>(
  parameters: T[] = [],
): UnionType<T> => ({
  kind: TypeKind.Union,
  parameters,
})
