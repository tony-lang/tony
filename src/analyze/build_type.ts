import {
  ConstrainedType,
  ParametricType,
  Type,
  TypeVariable,
  buildConstrainedType,
  buildParametricType,
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
): ConstrainedType<TypeVariable | ParametricType> => {
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
  buildConstrainedType(buildParametricType(getTypeName(node)))

const handleTypeDeclaration = (
  typeBindings: TypeBinding[][],
  node: TypeDeclarationNode,
) => {
  const name = getTypeName(node.nameNode)
  const constrainedParameters = node.parameterNodes.map(
    buildTypeBindingType(typeBindings),
  )
  const [parameters, constraints] = reduceConstraints(...constrainedParameters)
  return buildConstrainedType(
    buildParametricType(name, parameters),
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
): Type => {}
