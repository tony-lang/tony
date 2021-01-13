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
  TypeOfCategory,
  UnresolvedType,
} from './categories'

// ---- Types ----

/**
 * A property represents the mapping of a key to a value.
 */
export type Property<T extends TCR | TCU = TCR | TCU> = {
  key: CategorizedType<T>
  value: CategorizedType<T>
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

type TCD = TypeCategory.Declared
type TCR = TypeCategory.Resolved
type TCU = TypeCategory.Unresolved

/**
 * An access type reduces to the type a property of an object type maps to.
 */
export interface AccessType extends CategorizedType<TCU> {
  kind: typeof TypeKind.Access
  type: UnresolvedType
  property: UnresolvedType
}

/**
 * A conditional type reduces to one of two types depending on whether a given
 * type fulfills some constraints.
 */
export interface ConditionalType
  extends CategorizedType<TCU> {
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
export interface CurriedType<T extends TCR | TCU = TCR | TCU>
  extends CategorizedType<T> {
  kind: typeof TypeKind.Curried
  from: TypeOfCategory<T>
  to: TypeOfCategory<T>
}

/**
 * A generic type represents a type that may depend on other types.
 */
export interface GenericType extends CategorizedType<TCD> {
  kind: typeof TypeKind.Generic
  name: string
  typeParameters: TypeVariable[]
}

/**
 * An intersection type represents all types that can be assigned to all of its
 * parameters.
 */
export interface IntersectionType<T extends TCR | TCU = TCR | TCU>
  extends CategorizedType<T> {
  kind: typeof TypeKind.Intersection
  parameters: TypeOfCategory<T>[]
}

/**
 * A map type represents the scope of a mapping from values of a key type to
 * values of a value type.
 */
export interface MapType<T extends TCR | TCU = TCR | TCU>
  extends CategorizedType<T> {
  kind: typeof TypeKind.Map
  property: Property<T>
}

/**
 * An object type represents the scope of an object (e.g. its properties).
 */
export interface ObjectType<
T extends TCR | TCU = TCR | TCU
> extends CategorizedType<T> {
  kind: typeof TypeKind.Object
  properties: Property<T>[]
}

/**
 * A parametric type represents a concrete instance of an unresolved parametric
 * type.
 */
export interface ParametricType
  extends CategorizedType<TCU> {
  kind: typeof TypeKind.Parametric
  name: string
  typeArguments: UnresolvedType[]
  termArguments: SyntaxNode[]
}

/**
 * A refined type represents a type alongside some predicates on values of that
 * type.
 */
export interface RefinedType<
T extends TCR | TCU = TCR | TCU
> extends CategorizedType<T> {
  kind: typeof TypeKind.Refined
  type: TypeOfCategory<T>
  predicates: Predicate[]
}

/**
 * A refined term represents a term binding nested within a refined type
 * constrained by predicates.
 */
export interface RefinedTerm<T extends TCR | TCU>
  extends CategorizedType<T> {
  kind: typeof TypeKind.RefinedTerm
  name: string
}

/**
 * A subtraction type reduces to the union including all members of the left
 * union that do not appear in the right union.
 */
export interface SubtractionType
  extends CategorizedType<TCU> {
  kind: typeof TypeKind.Subtraction
  left: UnresolvedType
  right: UnresolvedType
}

/**
 * A type variable that is used internally and cannot be related to other types.
 */
export interface TemporaryTypeVariable {
  kind: typeof TypeKind.TemporaryVariable
}

/**
 * A term type represents an unresolved type of a node (resulting from
 * typeof's).
 */
export interface TermType extends CategorizedType<TCU> {
  kind: typeof TypeKind.Term
  bindings: TermBinding[]
}

/**
 * A type variable represents any type.
 */
export interface TypeVariable {
  kind: typeof TypeKind.Variable
}

/**
 * A union type represents the type of any of its parameters.
 */
export interface UnionType<
  T extends TCR | TCU = TCR | TCU
> extends CategorizedType<T> {
  kind: typeof TypeKind.Union
  parameters: TypeOfCategory<T>[]
}

// ---- Factories ----

export const buildProperty = <T extends TCR | TCU>(
  key: CategorizedType<T>,
  value: CategorizedType<T>,
): Property<T> => ({
  key,
  value,
})

export const buildAccessType = (
  type: UnresolvedType,
  property: UnresolvedType,
): AccessType => ({
  category: TypeCategory.Unresolved,
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
  category: TypeCategory.Unresolved,
  kind: TypeKind.Conditional,
  type,
  constraints,
  consequence,
  alternative,
})

export const buildCurriedType = <T extends TCR | TCU>(
  category: T,
  from: TypeOfCategory<T>,
  to: TypeOfCategory<T>,
): CurriedType<T> => ({
  category,
  kind: TypeKind.Curried,
  from,
  to,
})

export const buildGenericType = (
  name: string,
  typeParameters: TypeVariable[],
): GenericType => ({
  category: TypeCategory.Declared,
  kind: TypeKind.Generic,
  name,
  typeParameters,
})

export const buildIntersectionType = <T extends TCR | TCU>(
  category: T,
  parameters: TypeOfCategory<T>[] = [],
): IntersectionType<T> => ({
  category,
  kind: TypeKind.Intersection,
  parameters,
})

export const buildMapType = <T extends TCR | TCU>(
  category: T,
  property: Property<T>,
): MapType<T> => ({
  category,
  kind: TypeKind.Map,
  property,
})

export const buildObjectType = <T extends TCR | TCU>(
  category: T,
  properties: Property<T>[],
): ObjectType<T> => ({
  category,
  kind: TypeKind.Object,
  properties,
})

export const buildParametricType = (
  name: string,
  typeArguments: UnresolvedType[],
  termArguments: SyntaxNode[],
): ParametricType => ({
  category: TypeCategory.Unresolved,
  kind: TypeKind.Parametric,
  name,
  typeArguments,
  termArguments,
})

export const buildRefinedType = <T extends TCR | TCU>(
  category: T,
  type: TypeOfCategory<T>,
  predicates: Predicate[],
): RefinedType<T> => ({
  category,
  kind: TypeKind.Refined,
  type,
  predicates,
})

export const buildRefinedTerm = <T extends TCR | TCU>(category: T, name: string): RefinedTerm<T> => ({
  category,
  kind: TypeKind.RefinedTerm,
  name,
})

export const buildSubtractionType = (
  left: UnresolvedType,
  right: UnresolvedType,
): SubtractionType => ({
  category: TypeCategory.Unresolved,
  kind: TypeKind.Subtraction,
  left,
  right,
})

export const buildTemporaryTypeVariable = (): TemporaryTypeVariable => ({
  kind: TypeKind.TemporaryVariable,
})

export const buildTermType = (bindings: TermBinding[]): TermType => ({
  category: TypeCategory.Unresolved,
  kind: TypeKind.Term,
  bindings,
})

export const buildTypeVariable = (): TypeVariable => ({
  kind: TypeKind.Variable,
})

export const buildUnionType = <T extends TCR | TCU>(
  category: T,
  parameters: TypeOfCategory<T>[] = [],
): UnionType<T> => ({
  category,
  kind: TypeKind.Union,
  parameters,
})
