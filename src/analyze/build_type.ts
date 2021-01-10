import {
  AccessTypeNode,
  ConditionalTypeNode,
  CurriedTypeNode,
  IntersectionTypeNode,
  ListTypeNode,
  MapTypeNode,
  MemberTypeNode,
  ParametricTypeNode,
  RefinementTypeDeclarationNode,
  RefinementTypeNode,
  StructTypeNode,
  SubtractionTypeNode,
  SyntaxNode,
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
  ConstrainedType,
  buildConstrainedType,
} from '../types/type_inference/constraints'
import {
  DeclaredType,
  Property,
  RefinedTerm,
  RefinedType,
  TypeKind,
  TypeVariable,
  UnresolvedType,
  buildCurriedType,
  buildGenericType,
  buildIntersectionType,
  buildLiteralType,
  buildMapType,
  buildObjectType,
  buildParametricType,
  buildProperty,
  buildUnionType,
} from '../types/type_inference/types'
import { TypeBinding, TypeBindingNode } from '../types/analyze/bindings'
import {
  buildConstrainedUnknownTypeFromTypes,
  reduceConstraintTypes,
} from '../util/types'
import { getIdentifierName, getTypeName } from '../util/parse'
import {
  NUMBER_TYPE,
  buildPrimitiveType,
  isPrimitiveTypeName,
} from '../types/type_inference/primitive_types'
import { ScopeWithErrors } from '../types/analyze/scopes'
import { addErrorUnless } from '../util/traverse'
import { buildPrimitiveTypeArgumentsError } from '../types/errors/annotations'

type InternalTypeNode =
  | AccessTypeNode
  | ConditionalTypeNode
  | CurriedTypeNode
  | IntersectionTypeNode
  | ListTypeNode
  | MapTypeNode
  | ParametricTypeNode
  | RefinementTypeNode
  | RefinementTypeDeclarationNode
  | StructTypeNode
  | SubtractionTypeNode
  | TaggedTypeNode
  | TupleTypeNode
  | TypeGroupNode
  | TypeVariableNode
  | TypeofNode
  | UnionTypeNode

type State = {
  scopes: ScopeWithErrors[]
}

type Return<T extends State, U> = [newState: T, type: U]

const withState = <T extends State, U extends SyntaxNode, V>(
  state: T,
  nodes: U[],
  callback: (state: T, node: U) => Return<T, V>,
) =>
  nodes.reduce<Return<T, V[]>>(
    ([state, types], node) => {
      const [newState, type] = callback(state, node)
      return [newState, [...types, type]]
    },
    [state, []],
  )

/**
 * Given a node in the syntax tree and some state, returns the
 * type defined by the node.
 */
export const buildAliasType = <T extends State>(
  state: T,
  node: TypeBindingNode,
): Return<T, ConstrainedType<DeclaredType, UnresolvedType>> => {
  switch (node.type) {
    case SyntaxType.Enum:
      return [state, handleTypeNode(node.nameNode)]
    case SyntaxType.Interface:
    case SyntaxType.TypeAlias:
      return handleTypeDeclaration(state, node.nameNode)
    case SyntaxType.TypeVariableDeclaration:
      return handleTypeVariableDeclaration(state, node)
  }
}

const handleTypeNode = (node: TypeNode) =>
  buildConstrainedType(buildGenericType(getTypeName(node), []))

const handleTypeDeclaration = <T extends State>(
  state: T,
  node: TypeDeclarationNode,
): Return<T, ConstrainedType<DeclaredType, UnresolvedType>> => {
  const name = getTypeName(node.nameNode)
  const [stateWithParameters, constrainedTypeParameters] = withState(
    state,
    node.parameterNodes,
    handleTypeVariableDeclaration,
  )
  const [typeParameters, constraints] = reduceConstraintTypes(
    ...constrainedTypeParameters,
  )
  return [
    stateWithParameters,
    buildConstrainedType(buildGenericType(name, typeParameters), constraints),
  ]
}

const handleTypeVariableDeclaration = <T extends State>(
  state: T,
  node: TypeVariableDeclarationNode,
): Return<T, ConstrainedType<TypeVariable, UnresolvedType>> => {
  const [stateWithConstraints, constraints] = withState(
    state,
    node.constraintNodes,
    buildType,
  )
  return [
    stateWithConstraints,
    buildConstrainedUnknownTypeFromTypes(constraints),
  ]
}

/**
 * Given a node in the syntax tree and some state, returns the
 * type represented by the type binding.
 */
export const buildAliasedType = <T extends State>(
  state: T,
  node: TypeBindingNode,
): Return<T, UnresolvedType> => {}

/**
 * Given a node in the syntax tree and some state, returns the
 * type represented by the node.
 */
export const buildType = <T extends State>(
  state: T,
  node: InternalTypeNode,
): Return<T, UnresolvedType> => {
  switch (node.type) {
    case SyntaxType.CurriedType:
      return handleCurriedType(state, node)
    case SyntaxType.IntersectionType:
      return handleIntersectionType(state, node)
    case SyntaxType.ListType:
      return handleListType(state, node)
    case SyntaxType.MapType:
      return handleMapType(state, node)
    case SyntaxType.ParametricType:
      return handleParametricType(state, node)
    case SyntaxType.StructType:
      return handleStructType(state, node)
    case SyntaxType.TaggedType:
      return handleTaggedType(state, node)
    case SyntaxType.TupleType:
      return handleTupleType(state, node)
    case SyntaxType.UnionType:
      return handleUnionType(state, node)
  }
}

const handleCurriedType = <T extends State>(
  state: T,
  node: CurriedTypeNode,
): Return<T, UnresolvedType> => {
  const [stateWithFrom, fromType] = buildType(state, node.fromNode)
  const [stateWithTo, toType] = buildType(stateWithFrom, node.toNode)
  return [stateWithTo, buildCurriedType(fromType, toType)]
}

const handleIntersectionType = <T extends State>(
  state: T,
  node: IntersectionTypeNode,
): Return<T, UnresolvedType> => {
  const [stateWithLeft, leftType] = buildType(state, node.leftNode)
  const [stateWithRight, rightType] = buildType(stateWithLeft, node.rightNode)
  const type =
    rightType.kind === TypeKind.Intersection
      ? buildIntersectionType([leftType, ...rightType.parameters])
      : buildIntersectionType([leftType, rightType])
  return [stateWithRight, type]
}

const handleListType = <T extends State>(
  state: T,
  node: ListTypeNode,
): Return<T, UnresolvedType> => {
  const [stateWithElement, elementType] = buildType(state, node.elementNode)
  return [
    stateWithElement,
    buildMapType(buildProperty(NUMBER_TYPE, elementType)),
  ]
}

const handleMapType = <T extends State>(
  state: T,
  node: MapTypeNode,
): Return<T, UnresolvedType> => {
  const [stateWithKey, keyType] = buildType(state, node.keyNode)
  const [stateWithValue, valueType] = buildType(stateWithKey, node.valueNode)
  return [stateWithValue, buildMapType(buildProperty(keyType, valueType))]
}

const handleParametricType = <T extends State>(
  state: T,
  node: ParametricTypeNode,
): Return<T, UnresolvedType> => {
  const name = getTypeName(node.nameNode)
  if (isPrimitiveTypeName(name)) {
    const stateWithError = addErrorUnless<T>(
      node.argumentNodes.length === 0 && node.elementNodes.length === 0,
      buildPrimitiveTypeArgumentsError(),
    )(state, node)
    return [stateWithError, buildPrimitiveType(name)]
  }

  const [stateWithTypeArguments, typeArguments] = withState(
    state,
    node.argumentNodes,
    buildType,
  )
  const termArguments = node.elementNodes
  return [
    stateWithTypeArguments,
    buildParametricType(name, typeArguments, termArguments),
  ]
}

const handleStructType = <T extends State>(
  state: T,
  node: StructTypeNode,
): Return<T, UnresolvedType> => {
  const [stateWithMembers, memberTypes] = withState(
    state,
    node.memberNodes,
    handleMemberTypeNode,
  )
  return [stateWithMembers, buildObjectType(memberTypes)]
}

const handleTaggedType = <T extends State>(
  state: T,
  node: TaggedTypeNode,
): Return<T, UnresolvedType> => {
  const tag = buildProperty(
    buildLiteralType('tag'),
    buildLiteralType(getIdentifierName(node.nameNode)),
  )
  if (node.typeNode === undefined) return [state, buildObjectType([tag])]

  const [stateWithValue, valueType] = buildType(state, node.typeNode)
  const value = buildProperty(buildLiteralType('value'), valueType)
  return [stateWithValue, buildObjectType([tag, value])]
}

const handleTupleType = <T extends State>(
  state: T,
  node: TupleTypeNode,
): Return<T, UnresolvedType> => {
  const [stateWithElements, elementTypes] = withState(
    state,
    node.elementNodes,
    buildType,
  )
  return [
    stateWithElements,
    buildObjectType(
      elementTypes.map((elementType, i) =>
        buildProperty(buildLiteralType(i), elementType),
      ),
    ),
  ]
}

const handleUnionType = <T extends State>(
  state: T,
  node: UnionTypeNode,
): Return<T, UnresolvedType> => {
  const [stateWithLeft, leftType] = buildType(state, node.leftNode)
  const [stateWithRight, rightType] = buildType(stateWithLeft, node.rightNode)
  const type =
    rightType.kind === TypeKind.Union
      ? buildUnionType([leftType, ...rightType.parameters])
      : buildUnionType([leftType, rightType])
  return [stateWithRight, type]
}

const handleMemberTypeNode = <T extends State>(
  state: T,
  node: MemberTypeNode,
): Return<T, Property<RefinedType<RefinedTerm>, UnresolvedType>> => {
  const [stateWithValue, valueType] = buildType(state, node.valueNode)
  return [
    stateWithValue,
    buildProperty(buildLiteralType(getIdentifierName(node.keyNode)), valueType),
  ]
}
