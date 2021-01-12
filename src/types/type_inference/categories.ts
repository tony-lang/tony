import { PrimitiveType } from './primitive_types'

export enum TypeCategory {
  Declared,
  Resolved,
  Unresolved,
}

export interface CategorizedType<T extends TypeCategory = TypeCategory> {
  category: T
}

export type DeclaredType = CategorizedType<TypeCategory.Declared>
export type UnresolvedType =
  | CategorizedType<TypeCategory.Unresolved>
  | PrimitiveType
export type ResolvedType =
  | CategorizedType<TypeCategory.Resolved>
  | PrimitiveType

export type Type = UnresolvedType | ResolvedType
