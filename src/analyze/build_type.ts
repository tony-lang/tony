import {
  ConstrainedType,
  DeclaredType,
  TypeKind,
  UnresolvedType,
  buildConstrainedType,
  buildCurriedType,
  buildGenericType,
  buildIntersectionType,
  buildLiteralType,
  buildMapType,
  buildObjectType,
  buildParametricType,
  buildProperty,
  buildTaggedType,
  buildUnionType,
} from '../types/type_inference/types'
import {
  CurriedTypeNode,
  IntersectionTypeNode,
  ListTypeNode,
  MapTypeNode,
  MemberTypeNode,
  ParametricTypeNode,
  RefinementTypeDeclarationNode,
  RefinementTypeNode,
  StructTypeNode,
  SyntaxType,
  TaggedTypeNode,
  TupleTypeNode,
  TypeDeclarationNode,
  TypeGroupNode,
  TypeNode,
  TypeVariableDeclarationNode,
  TypeVariableNode,
  TypeofNode,
  UnionTypeNode,
} from 'tree-sitter-tony'
import { TypeBinding, TypeBindingNode } from '../types/analyze/bindings'
import {
  buildConstrainedUnknownTypeFromTypes,
  reduceConstraintTypes,
} from '../util/types'
import { getIdentifierName, getTypeName } from '../util/parse'
import { NUMBER_TYPE } from '../types/type_inference/primitive_types'

type InternalTypeNode =
  | CurriedTypeNode
  | IntersectionTypeNode
  | ListTypeNode
  | MapTypeNode
  | ParametricTypeNode
  | RefinementTypeNode
  | RefinementTypeDeclarationNode
  | StructTypeNode
  | TaggedTypeNode
  | TupleTypeNode
  | TypeGroupNode
  | TypeVariableNode
  | TypeofNode
  | UnionTypeNode

/**
 * Given a node in the syntax tree and a stack of type bindings, returns the
 * type defined by the node.
 */
export const buildTypeBindingType = (types: TypeBinding[][]) => (
  node: TypeBindingNode,
): ConstrainedType<DeclaredType, UnresolvedType> => {
  switch (node.type) {
    case SyntaxType.Enum:
      return handleTypeNode(node.nameNode)
    case SyntaxType.Interface:
    case SyntaxType.TypeAlias:
      return handleTypeDeclaration(types, node.nameNode)
    case SyntaxType.TypeVariableDeclaration:
      return handleTypeVariableDeclaration(types, node)
  }
}

const handleTypeNode = (node: TypeNode) =>
  buildConstrainedType(buildGenericType(getTypeName(node), []))

const handleTypeDeclaration = (
  types: TypeBinding[][],
  node: TypeDeclarationNode,
) => {
  const name = getTypeName(node.nameNode)
  const constrainedTypeParameters = node.parameterNodes.map((child) =>
    handleTypeVariableDeclaration(types, child),
  )
  const [typeParameters, constraints] = reduceConstraintTypes(
    ...constrainedTypeParameters,
  )
  return buildConstrainedType(
    buildGenericType(name, typeParameters),
    constraints,
  )
}

const handleTypeVariableDeclaration = (
  types: TypeBinding[][],
  node: TypeVariableDeclarationNode,
) => {
  const constraints = node.constraintNodes.map(buildType(types))
  return buildConstrainedUnknownTypeFromTypes(constraints)
}

/**
 * Given a node in the syntax tree and a stack of type bindings, returns the
 * type represented by the type binding.
 */
export const buildTypeBindingValueType = (types: TypeBinding[][]) => (
  node: TypeBindingNode,
): UnresolvedType => {}

/**
 * Given a node in the syntax tree and a stack of type bindings, returns the
 * type represented by the node.
 */
export const buildType = (types: TypeBinding[][]) => (
  node: InternalTypeNode,
): UnresolvedType => {
  switch (node.type) {
    case SyntaxType.CurriedType:
      return handleCurriedType(types, node)
    case SyntaxType.IntersectionType:
      return handleIntersectionType(types, node)
    case SyntaxType.ListType:
      return handleListType(types, node)
    case SyntaxType.MapType:
      return handleMapType(types, node)
    case SyntaxType.ParametricType:
      return handleParametricType(types, node)
    case SyntaxType.StructType:
      return handleStructType(types, node)
    case SyntaxType.TaggedType:
      return handleTaggedType(types, node)
    case SyntaxType.TupleType:
      return handleTupleType(types, node)
    case SyntaxType.UnionType:
      return handleUnionType(types, node)
  }
}

const handleCurriedType = (types: TypeBinding[][], node: CurriedTypeNode) =>
  buildCurriedType(
    buildType(types)(node.fromNode),
    buildType(types)(node.toNode),
  )

const handleIntersectionType = (
  types: TypeBinding[][],
  node: IntersectionTypeNode,
) => {
  const leftType = buildType(types)(node.leftNode)
  const rightType = buildType(types)(node.rightNode)
  if (rightType.kind === TypeKind.Intersection)
    return buildIntersectionType([leftType, ...rightType.parameters])
  else return buildIntersectionType([leftType, rightType])
}

const handleListType = (types: TypeBinding[][], node: ListTypeNode) =>
  buildMapType(buildProperty(NUMBER_TYPE, buildType(types)(node.elementNode)))

const handleMapType = (types: TypeBinding[][], node: MapTypeNode) =>
  buildMapType(
    buildProperty(
      buildType(types)(node.keyNode),
      buildType(types)(node.valueNode),
    ),
  )

const handleParametricType = (
  types: TypeBinding[][],
  node: ParametricTypeNode,
) => {
  const name = getTypeName(node.nameNode)
  const typeArguments = node.argumentNodes.map(buildType(types))
  const termArguments = node.elementNodes
  return buildParametricType(name, typeArguments, termArguments)
}

const handleStructType = (types: TypeBinding[][], node: StructTypeNode) =>
  buildObjectType(node.memberNodes.map(handleMemberTypeNode(types)))

const handleTaggedType = (types: TypeBinding[][], node: TaggedTypeNode) =>
  buildTaggedType(
    getIdentifierName(node.nameNode),
    buildType(types)(node.typeNode),
  )

const handleTupleType = (types: TypeBinding[][], node: TupleTypeNode) =>
  buildObjectType(
    node.elementNodes.map((elementNode, i) =>
      buildProperty(buildLiteralType(i), buildType(types)(elementNode)),
    ),
  )

const handleUnionType = (types: TypeBinding[][], node: UnionTypeNode) => {
  const leftType = buildType(types)(node.leftNode)
  const rightType = buildType(types)(node.rightNode)
  if (rightType.kind === TypeKind.Union)
    return buildUnionType([leftType, ...rightType.parameters])
  else return buildUnionType([leftType, rightType])
}

const handleMemberTypeNode = (types: TypeBinding[][]) => (
  node: MemberTypeNode,
) =>
  buildProperty(
    buildLiteralType(getIdentifierName(node.keyNode)),
    buildType(types)(node.valueNode),
  )
