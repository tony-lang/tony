import {
  ConstrainedType,
  GenericType,
  Type,
  TypeKind,
  TypeVariable,
  buildConstrainedType,
  buildCurriedType,
  buildGenericType,
  buildIntersectionType,
  buildParametricType,
  buildUnionType,
} from '../types/type_inference/types'
import {
  CurriedTypeNode,
  IntersectionTypeNode,
  ListTypeNode,
  NamedTypeNode,
  ParametricTypeNode,
  RefinementTypeDeclarationNode,
  RefinementTypeNode,
  StructTypeNode,
  SyntaxType,
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
  reduceConstraints,
} from '../util/types'
import { getTypeName } from '../util/parse'

type InternalTypeNode =
  | CurriedTypeNode
  | IntersectionTypeNode
  | ListTypeNode
  | NamedTypeNode
  | ParametricTypeNode
  | RefinementTypeNode
  | RefinementTypeDeclarationNode
  | StructTypeNode
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
): ConstrainedType<TypeVariable | GenericType> => {
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
  const constrainedTypeParameters = node.parameterNodes.map(
    buildTypeBindingType(typeBindings),
  )
  const [typeParameters, constraints] = reduceConstraints(
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
 * type represented by the node.
 */
export const buildType = (typeBindings: TypeBinding[][]) => (
  node: InternalTypeNode,
): Type => {
  switch (node.type) {
    case SyntaxType.CurriedType:
      return handleCurriedType(typeBindings, node)
    case SyntaxType.IntersectionType:
      return handleIntersectionType(typeBindings, node)
    case SyntaxType.ParametricType:
      return handleParametricType(typeBindings, node)
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

const handleParametricType = (
  typeBindings: TypeBinding[][],
  node: ParametricTypeNode,
) => {
  const name = getTypeName(node.nameNode)
  const typeArguments = node.argumentNodes.map(buildType(typeBindings))
  const termArguments = node.elementNodes
  return buildParametricType(name, typeArguments, termArguments)
}

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
