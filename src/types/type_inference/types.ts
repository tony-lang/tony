import { Predicate } from './predicates'
import { SyntaxNode } from 'tree-sitter-tony/tony'
import { Type } from './categories'
import { flattenType } from '../../util/types'

// ---- Types ----

/**
 * A property represents the mapping of a key to a value.
 */
export type Property<T extends Type = Type> = {
  readonly key: T
  readonly value: T
}

export enum TypeKind {
  Access,
  Conditional,
  Curried,
  Generic,
  Interface,
  Intersection,
  Object,
  Parametric,
  Refined,
  RefinedTerm,
  Subtraction,
  Tagged,
  TemporaryVariable,
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
export interface AccessType {
  readonly kind: typeof TypeKind.Access
  readonly type: Type
  readonly property: Type
}

/**
 * A conditional type reduces to one of two types depending on whether a given
 * type fulfills some constraints.
 */
export interface ConditionalType {
  readonly kind: typeof TypeKind.Conditional
  readonly type: Type
  readonly constraints: Type[]
  readonly consequence: Type
  readonly alternative: Type
}

/**
 * A curried type represents an abstraction parametrized by the `from` type and
 * returning the `to` type.
 */
export interface CurriedType<T extends Type = Type> {
  readonly kind: typeof TypeKind.Curried
  readonly from: T
  readonly to: T
  /**
   * A curried type is external when it represents an uncurried function
   * imported from JavaScript. Before values of this type are used, they should
   * be curried.
   */
  readonly isExternal: boolean
}

/**
 * A generic type represents a type that may depend on other types.
 */
export interface GenericType {
  readonly kind: typeof TypeKind.Generic
  readonly name: string
  readonly typeParameters: TypeVariable[]
}

/**
 * An interface type represents all members that implementors have to implement
 * to be an instance of an interface.
 */
export interface InterfaceType<T extends Type = Type> {
  readonly kind: typeof TypeKind.Interface
  readonly members: Property<T>[]
}

/**
 * An intersection type represents all types that can be assigned to all of its
 * parameters.
 */
export interface IntersectionType<T extends Type = Type> {
  readonly kind: typeof TypeKind.Intersection
  readonly parameters: T[]
}

/**
 * An object type represents the scope of an object (e.g. its properties).
 */
export interface ObjectType<T extends Type = Type> {
  readonly kind: typeof TypeKind.Object
  readonly properties: Property<T>[]
}

/**
 * A parametric type represents a concrete instance of an unresolved parametric
 * type.
 */
export interface ParametricType {
  readonly kind: typeof TypeKind.Parametric
  readonly name: string
  readonly typeArguments: Type[]
  readonly termArguments: SyntaxNode[]
}

/**
 * A refined type represents a type alongside some predicates on values of that
 * type.
 */
export interface RefinedType<T extends Type = Type> {
  readonly kind: typeof TypeKind.Refined
  readonly type: T
  readonly predicates: Predicate[]
}

/**
 * A refined term represents a term binding nested within a refined type
 * constrained by predicates.
 */
export interface RefinedTerm {
  readonly kind: typeof TypeKind.RefinedTerm
  readonly name: string
}

/**
 * A subtraction type reduces to the union including all members of the left
 * union that do not appear in the right union.
 */
export interface SubtractionType {
  readonly kind: typeof TypeKind.Subtraction
  readonly left: Type
  readonly right: Type
}

/**
 * A type variable that is used internally and cannot be related to other types.
 */
export interface TemporaryTypeVariable {
  readonly kind: typeof TypeKind.TemporaryVariable
}

/**
 * A type variable represents any type.
 */
export interface TypeVariable {
  readonly kind: typeof TypeKind.Variable
}

/**
 * A union type represents the type of any of its parameters.
 */
export interface UnionType<T extends Type = Type> {
  readonly kind: typeof TypeKind.Union
  readonly parameters: T[]
}

// ---- Factories ----

export const buildProperty = <T extends Type>(
  key: T,
  value: T,
): Property<T> => ({
  key,
  value,
})

export const buildAccessType = (type: Type, property: Type): AccessType => ({
  kind: TypeKind.Access,
  type,
  property,
})

export const buildConditionalType = (
  type: Type,
  constraints: Type[],
  consequence: Type,
  alternative: Type,
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
  isExternal = false,
): CurriedType<T> => ({
  kind: TypeKind.Curried,
  from,
  to,
  isExternal,
})

export const buildGenericType = (
  name: string,
  typeParameters: TypeVariable[],
): GenericType => ({
  kind: TypeKind.Generic,
  name,
  typeParameters,
})

export const buildInterfaceType = <T extends Type>(
  members: Property<T>[] = [],
): InterfaceType<T> => ({
  kind: TypeKind.Interface,
  members,
})

export const buildIntersectionType = <T extends Type>(
  parameters: T[] = [],
): IntersectionType<T> =>
  flattenType({
    kind: TypeKind.Intersection,
    parameters,
  })

export const buildObjectType = <T extends Type>(
  properties: Property<T>[],
): ObjectType<T> => ({
  kind: TypeKind.Object,
  properties,
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
  left: Type,
  right: Type,
): SubtractionType => ({
  kind: TypeKind.Subtraction,
  left,
  right,
})

export const buildTemporaryTypeVariable = (): TemporaryTypeVariable => ({
  kind: TypeKind.TemporaryVariable,
})

export const buildTypeVariable = (): TypeVariable => ({
  kind: TypeKind.Variable,
})

export const buildUnionType = <T extends Type>(
  parameters: T[] = [],
): UnionType<T> =>
  flattenType({
    kind: TypeKind.Union,
    parameters,
  })
