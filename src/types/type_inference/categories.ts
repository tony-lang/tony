import { PrimitiveType } from "./primitive_types"
import { AccessType, ConditionalType, CurriedType, GenericType, IntersectionType, MapType, ObjectType, ParametricType, RefinedTerm, RefinedType, SubtractionType, TemporaryTypeVariable, TermType, TypeKind, TypeVariable, UnionType } from "./types"

export enum TypeCategory {
  Declared,
  Resolved,
  Unresolved,
}

export interface CategorizedType<T extends TypeCategory> {
  category: T
}

export type DeclaredType = TypeVariable | TemporaryTypeVariable | GenericType
export type UnresolvedType =
  | ResolvedType
  // overriding types
  | CurriedType<TypeCategory.Unresolved>
  | RefinedType<TypeCategory.Unresolved>
  | RefinedTerm<TypeCategory.Unresolved>
  | ObjectType<TypeCategory.Unresolved>
  | MapType<TypeCategory.Unresolved>
  | UnionType<TypeCategory.Unresolved>
  | IntersectionType<TypeCategory.Unresolved>
  | PrimitiveType<TypeCategory.Unresolved>
  // solely unresolved types
  | AccessType
  | ConditionalType
  | ParametricType
  | SubtractionType
  | TermType
export type ResolvedType =
  | TypeVariable
  | TemporaryTypeVariable
  | CurriedType<TypeCategory.Resolved>
  | RefinedType<TypeCategory.Resolved>
  | RefinedTerm<TypeCategory.Resolved>
  | ObjectType<TypeCategory.Resolved>
  | MapType<TypeCategory.Resolved>
  | UnionType<TypeCategory.Resolved>
  | IntersectionType<TypeCategory.Resolved>
  | PrimitiveType<TypeCategory.Resolved>

export type TypeOfCategory<T extends TypeCategory> = T extends TypeCategory.Declared ? DeclaredType : T extends TypeCategory.Resolved ? ResolvedType : T extends TypeCategory.Unresolved ? UnresolvedType : never

export type Type = UnresolvedType
