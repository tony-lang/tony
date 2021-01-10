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
import {
  LocalTypeBinding,
  TypeBinding,
  TypeBindingNode,
} from '../types/analyze/bindings'
import { reduceConstraintTypes } from '../util/types'
import {
  getIdentifierName,
  getTypeName,
  getTypeVariableName,
} from '../util/parse'
import {
  NUMBER_TYPE,
  buildPrimitiveType,
  isPrimitiveTypeName,
} from '../types/type_inference/primitive_types'
import { ScopeWithErrors, ScopeWithTypes } from '../types/analyze/scopes'
import { addErrorUnless } from '../util/traverse'
import { buildPrimitiveTypeArgumentsError } from '../types/errors/annotations'
import { findBinding } from '../util/bindings'
import { getTypeVariables, getTypes } from '../util/scopes'
import { assert, NotImplementedError } from '../types/errors/internal'

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
  scopes: (ScopeWithErrors & ScopeWithTypes)[]
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
 * Given a node in the syntax tree and some state, returns the type defined by
 * the node.
 */
export const buildAliasType = <T extends State>(
  state: T,
  node: TypeBindingNode,
): Return<T, DeclaredType> => {
  switch (node.type) {
    case SyntaxType.Enum:
      return [state, handleTypeNode(node.nameNode)]
    case SyntaxType.Interface:
    case SyntaxType.TypeAlias:
      return handleTypeDeclaration(state, node.nameNode)
  }
}

const handleTypeNode = (node: TypeNode) =>
  buildGenericType(getTypeName(node), [])

const handleTypeDeclaration = <T extends State>(
  state: T,
  node: TypeDeclarationNode,
): Return<T, DeclaredType> => {
  const name = getTypeName(node.nameNode)
  const typeParameters = node.parameterNodes.map((child) =>
    findTypeVariable(state, child),
  )
  return [state, buildGenericType(name, typeParameters)]
}

const findTypeVariable = <T extends State>(
  state: T,
  node: TypeVariableDeclarationNode,
) => {
  const name = getTypeVariableName(node.nameNode)
  const typeVariableBinding = findBinding(
    name,
    state.scopes.map(getTypeVariables),
  )
  assert(
    typeVariableBinding !== undefined,
    'Type variables should be added to the scope before relevant types are built.',
  )
  return typeVariableBinding.value
}

/**
 * Given a node in the syntax tree and some state, returns the type represented
 * by the type binding.
 */
export const buildAliasedType = <T extends State>(
  state: T,
  node: TypeBindingNode,
): Return<T, UnresolvedType> => {}

/**
 * Given a node in the syntax tree and some state, returns the type represented
 * by the node.
 */
export const buildType = <T extends State>(
  state: T,
  node: InternalTypeNode,
): Return<T, UnresolvedType> => {
  switch (node.type) {
    case SyntaxType.AccessType:
      throw new NotImplementedError(
        'Tony cannot build access types yet.',
      )
    case SyntaxType.ConditionalType:
      throw new NotImplementedError(
        'Tony cannot build conditional types yet.',
      )
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
    case SyntaxType.RefinementType:
      throw new NotImplementedError(
        'Tony cannot build refinement types yet.',
      )
    case SyntaxType.RefinementTypeDeclaration:
      throw new NotImplementedError(
        'Tony cannot build refinement types yet.',
      )
    case SyntaxType.StructType:
      return handleStructType(state, node)
    case SyntaxType.SubtractionType:
      throw new NotImplementedError(
        'Tony cannot build subtraction types yet.',
      )
    case SyntaxType.TaggedType:
      return handleTaggedType(state, node)
    case SyntaxType.TupleType:
      return handleTupleType(state, node)
    case SyntaxType.TypeGroup:
      throw new NotImplementedError(
        'Tony cannot build type groups yet.',
      )
    case SyntaxType.TypeVariable:
      throw new NotImplementedError(
        'Tony cannot build type variables yet.',
      )
    case SyntaxType.Typeof:
      throw new NotImplementedError(
        'Tony cannot build typeofs yet.',
      )
    case SyntaxType.UnionType:
      return handleUnionType(state, node)
  }
}

/**
 * Given nodes in the syntax tree and some state, returns the types represented
 * by the nodes.
 */
export const buildTypes = <T extends State>(
  state: T,
  nodes: InternalTypeNode[],
): Return<T, UnresolvedType[]> => withState(state, nodes, buildType)

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

  const [stateWithTypeArguments, typeArguments] = buildTypes(
    state,
    node.argumentNodes,
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
  const [stateWithElements, elementTypes] = buildTypes(state, node.elementNodes)
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
