import {
  BOOLEAN_TYPE_NAME,
  NUMBER_TYPE_NAME,
  REG_EXP_TYPE_NAME,
  STRING_TYPE_NAME,
  VOID_TYPE_NAME,
} from '../constants'
import {
  ConstrainedType,
  NamedType,
  TypeConstraints,
  TypeKind,
  TypeVariable,
  buildConstrainedType,
  buildUnnamedTypeVariable,
} from '../types/type_inference/types'
import { PrimitiveType } from '../types/type_inference/primitive_types'

export const buildUnconstrainedUnknownType = (): ConstrainedType<TypeVariable> =>
  buildConstrainedType(buildUnnamedTypeVariable())

export const buildConstrainedUnknownType = (
  constraints: TypeConstraints,
): ConstrainedType<TypeVariable> =>
  buildConstrainedType(buildUnnamedTypeVariable(), constraints)

export const getNameOfType = (type: NamedType): string => {
  switch (type.kind) {
    case TypeKind.Parametric:
    case TypeKind.NamedVariable:
      return type.name
    default:
      return getNameOfPrimitiveType(type)
  }
}

const getNameOfPrimitiveType = (type: PrimitiveType): string => {
  switch (type.kind) {
    case TypeKind.Boolean:
      return BOOLEAN_TYPE_NAME
    case TypeKind.Number:
      return NUMBER_TYPE_NAME
    case TypeKind.RegExp:
      return REG_EXP_TYPE_NAME
    case TypeKind.String:
      return STRING_TYPE_NAME
    case TypeKind.Void:
      return VOID_TYPE_NAME
  }
}
