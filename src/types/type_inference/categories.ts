import {
  AccessType,
  ConditionalType,
  CurriedType,
  GenericType,
  InterfaceType,
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

export type ResolvedType =
  | VariableType
  | CurriedType<ResolvedType>
  | InterfaceType<ResolvedType>
  | IntersectionType<ResolvedType>
  | MapType<ResolvedType>
  | ObjectType<ResolvedType>
  | PrimitiveType
  | RefinedTerm
  | RefinedType<ResolvedType>
  | UnionType<ResolvedType>

export type Type =
  | ResolvedType
  // overriding types
  | CurriedType<Type>
  | InterfaceType<Type>
  | IntersectionType<Type>
  | MapType<Type>
  | ObjectType<Type>
  | PrimitiveType
  | RefinedTerm
  | RefinedType<Type>
  | UnionType<Type>
  // solely unresolved types
  | AccessType
  | ConditionalType
  | ParametricType
  | SubtractionType
  | TermType
