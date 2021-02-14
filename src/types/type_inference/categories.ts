import {
  AccessType,
  ClassType,
  ConditionalType,
  CurriedType,
  GenericType,
  IntersectionType,
  Keyof,
  ObjectType,
  ParametricType,
  RefinedTerm,
  RefinedType,
  SubtractionType,
  TemporaryTypeVariable,
  TypeVariable,
  UnionType,
} from './types'
import { PrimitiveType } from './primitive_types'

type VariableType = TypeVariable | TemporaryTypeVariable

export type DeclaredType = VariableType | GenericType

export type ResolvedType =
  | VariableType
  | ClassType<ResolvedType>
  | CurriedType<ResolvedType>
  | IntersectionType<ResolvedType>
  | ObjectType<ResolvedType>
  | PrimitiveType
  | RefinedTerm
  | RefinedType<ResolvedType>
  | UnionType<ResolvedType>

export type Type =
  | ResolvedType
  // overriding types
  | ClassType<Type>
  | CurriedType<Type>
  | IntersectionType<Type>
  | ObjectType<Type>
  | RefinedType<Type>
  | UnionType<Type>
  // solely unresolved types
  | AccessType
  | ConditionalType
  | Keyof
  | ParametricType
  | SubtractionType
