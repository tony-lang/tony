import {
  AccessType,
  ConditionalType,
  CurriedType,
  GenericType,
  IntersectionType,
  MapType,
  ObjectType,
  ParametricType,
  RefinedTerm,
  RefinedType,
  SubtractionType,
  TemporaryTypeVariable,
  TermType,
  TypeVariable,
  UnionType,
} from './types'
import { PrimitiveType } from './primitive_types'

type VariableType = TypeVariable | TemporaryTypeVariable
export type DeclaredType = VariableType | GenericType
export type Type =
  | ResolvedType
  // overriding types
  | CurriedType<Type>
  | RefinedType<Type>
  | RefinedTerm
  | ObjectType<Type>
  | MapType<Type>
  | UnionType<Type>
  | IntersectionType<Type>
  | PrimitiveType
  // solely unresolved types
  | AccessType
  | ConditionalType
  | ParametricType
  | SubtractionType
  | TermType
export type ResolvedType =
  | VariableType
  | CurriedType<ResolvedType>
  | RefinedType<ResolvedType>
  | RefinedTerm
  | ObjectType<ResolvedType>
  | MapType<ResolvedType>
  | UnionType<ResolvedType>
  | IntersectionType<ResolvedType>
  | PrimitiveType
