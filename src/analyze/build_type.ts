import {
  ConstrainedType,
  DeclaredType,
  TypeKind,
  UnresolvedType,
  buildConstrainedType,
  buildCurriedType,
  buildGenericType,
  buildIntersectionType,
  buildMapType,
  buildObjectType,
  buildParametricType,
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
import {
  TypeBinding,
  TypeBindingNode,
  buildLocalTermBinding,
  buildTypedTermBinding,
} from '../types/analyze/bindings'
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
export const buildTypeBindingType = (typeBindings: TypeBinding[][]) => (
  node: TypeBindingNode,
): ConstrainedType<DeclaredType, UnresolvedType> => {
  switch (node.type) {
    case SyntaxType.Enum:
      return handleTypeNode(node.nameNode)
    case SyntaxType.Interface:
    case SyntaxType.TypeAlias:
      return handleTypeDeclaration(typeBindings, node.nameNode)
    case SyntaxType.TypeVariableDeclaration:
      return handleTypeVariableDeclaration(typeBindings, node)
  }
}

const handleTypeNode = (node: TypeNode) =>
  buildConstrainedType(buildGenericType(getTypeName(node), []))

const handleTypeDeclaration = (
  typeBindings: TypeBinding[][],
  node: TypeDeclarationNode,
) => {
  const name = getTypeName(node.nameNode)
  const constrainedTypeParameters = node.parameterNodes.map((child) =>
    handleTypeVariableDeclaration(typeBindings, child),
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
  typeBindings: TypeBinding[][],
  node: TypeVariableDeclarationNode,
) => {
  const constraints = node.constraintNodes.map(buildType(typeBindings))
  return buildConstrainedUnknownTypeFromTypes(constraints)
}

/**
 * Given a node in the syntax tree and a stack of type bindings, returns the
 * type represented by the type binding.
 */
export const buildTypeBindingValueType = (typeBindings: TypeBinding[][]) => (
  node: TypeBindingNode,
): UnresolvedType => {}

/**
 * Given a node in the syntax tree and a stack of type bindings, returns the
 * type represented by the node.
 */
export const buildType = (typeBindings: TypeBinding[][]) => (
  node: InternalTypeNode,
): UnresolvedType => {
  switch (node.type) {
    case SyntaxType.CurriedType:
      return handleCurriedType(typeBindings, node)
    case SyntaxType.IntersectionType:
      return handleIntersectionType(typeBindings, node)
    case SyntaxType.ListType:
      return handleListType(typeBindings, node)
    case SyntaxType.MapType:
      return handleMapType(typeBindings, node)
    case SyntaxType.TaggedType:
      return handleTaggedType(typeBindings, node)
    case SyntaxType.ParametricType:
      return handleParametricType(typeBindings, node)
    case SyntaxType.StructType:
      return handleStructType(typeBindings, node)
    case SyntaxType.UnionType:
      return handleUnionType(typeBindings, node)
  }
}

const handleCurriedType = (
  typeBindings: TypeBinding[][],
  node: CurriedTypeNode,
) =>
  buildCurriedType(
    buildType(typeBindings)(node.fromNode),
    buildType(typeBindings)(node.toNode),
  )

const handleIntersectionType = (
  typeBindings: TypeBinding[][],
  node: IntersectionTypeNode,
) => {
  const leftType = buildType(typeBindings)(node.leftNode)
  const rightType = buildType(typeBindings)(node.rightNode)
  if (rightType.kind === TypeKind.Intersection)
    return buildIntersectionType([leftType, ...rightType.parameters])
  else return buildIntersectionType([leftType, rightType])
}

const handleListType = (typeBindings: TypeBinding[][], node: ListTypeNode) =>
  buildMapType(NUMBER_TYPE, buildType(typeBindings)(node.elementNode))

const handleMapType = (typeBindings: TypeBinding[][], node: MapTypeNode) =>
  buildMapType(
    buildType(typeBindings)(node.keyNode),
    buildType(typeBindings)(node.valueNode),
  )

const handleParametricType = (
  typeBindings: TypeBinding[][],
  node: ParametricTypeNode,
) => {
  const name = getTypeName(node.nameNode)
  const typeArguments = node.argumentNodes.map(buildType(typeBindings))
  const termArguments = node.elementNodes
  return buildParametricType(name, typeArguments, termArguments)
}

const handleStructType = (
  typeBindings: TypeBinding[][],
  node: StructTypeNode,
) => buildObjectType(node.memberNodes.map(handleMemberTypeNode(typeBindings)))

const handleUnionType = (
  typeBindings: TypeBinding[][],
  node: UnionTypeNode,
) => {
  const leftType = buildType(typeBindings)(node.leftNode)
  const rightType = buildType(typeBindings)(node.rightNode)
  if (rightType.kind === TypeKind.Union)
    return buildUnionType([leftType, ...rightType.parameters])
  else return buildUnionType([leftType, rightType])
}

const handleMemberTypeNode = (typeBindings: TypeBinding[][]) => (
  node: MemberTypeNode,
) =>
  buildTypedTermBinding(
    buildLocalTermBinding(getIdentifierName(node.keyNode), node, false),
    buildConstrainedType(buildType(typeBindings)(node.valueNode)),
  )

const handleTaggedType = (
  typeBindings: TypeBinding[][],
  node: TaggedTypeNode,
) =>
  buildTaggedType(
    getIdentifierName(node.nameNode),
    buildType(typeBindings)(node.typeNode),
  )
