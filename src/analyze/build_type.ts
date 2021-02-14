import {
  AccessTypeNode,
  BooleanNode,
  ClassMemberNode,
  ClassNode,
  ConditionalTypeNode,
  CurriedTypeNode,
  EnumNode,
  EnumValueNode,
  IdentifierNode,
  IntersectionTypeNode,
  KeyofNode,
  ListTypeNode,
  MapTypeNode,
  MemberTypeNode,
  NumberNode,
  ParametricTypeNode,
  RefinementTypeDeclarationNode,
  RefinementTypeNode,
  RegexNode,
  StringNode,
  StructTypeNode,
  SubtractionTypeNode,
  SyntaxNode,
  SyntaxType,
  TaggedTypeNode,
  TupleTypeNode,
  TypeDeclarationNode,
  TypeGroupNode,
  TypeNode,
  TypeVariableDeclarationNameNode,
  TypeVariableNode,
  TypeofNode,
  UnionTypeNode,
} from 'tree-sitter-tony/tony'
import {
  BOOLEAN_TYPE,
  NUMBER_TYPE,
  REG_EXP_TYPE,
  STRING_TYPE,
  findPrimitiveType,
  isPrimitiveTypeName,
} from '../types/type_inference/primitive_types'
import { DeclaredType, Type } from '../types/type_inference/categories'
import {
  DeferredTypeVariableAssignment,
  buildDeferredTypeVariableAssignment,
} from '../types/type_inference/constraints'
import { NotImplementedError, assert } from '../types/errors/internal'
import {
  Property,
  buildAccessType,
  buildClassType,
  buildConditionalType,
  buildCurriedType,
  buildGenericType,
  buildIntersectionType,
  buildKeyof,
  buildObjectType,
  buildParametricType,
  buildProperty,
  buildSubtractionType,
  buildTypeVariable,
  buildUnionType,
} from '../types/type_inference/types'
import {
  RecursiveScope,
  ScopeWithErrors,
  ScopeWithTerms,
  ScopeWithTypes,
} from '../types/analyze/scopes'
import { buildLiteralType, flattenType } from '../util/types'
import { findBinding, findBindings } from '../util/bindings'
import {
  getIdentifierName,
  getTypeName,
  getTypeVariableName,
} from '../util/parse'
import { getTerms, getTypeVariables } from '../util/scopes'
import { AbstractState } from './types'
import { LocalTypeBindingNode } from '../types/analyze/bindings'
import { addErrorUnless } from '../util/traverse'
import { buildPrimitiveTypeArgumentsError } from '../types/errors/annotations'
import { mergeDeferredAssignments } from '../type_inference/constraints'

type InternalTypeNode =
  | AccessTypeNode
  | ConditionalTypeNode
  | CurriedTypeNode
  | IntersectionTypeNode
  | KeyofNode
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

type ImmediateTermLevelNode =
  | BooleanNode
  | IdentifierNode
  | NumberNode
  | RegexNode
  | StringNode

type Return<T extends AbstractState, U> = [
  newState: T,
  deferredAssignments: DeferredTypeVariableAssignment[],
  type: U,
]

const withState = <T extends AbstractState, U extends SyntaxNode, V>(
  state: T,
  nodes: U[],
  callback: (state: T, node: U, i: number) => Return<T, V>,
) =>
  nodes.reduce<Return<T, V[]>>(
    ([state, deferredAssignments, types], node, i) => {
      const [newState, newDeferredAssignments, type] = callback(state, node, i)
      return [
        newState,
        mergeDeferredAssignments(deferredAssignments, newDeferredAssignments),
        [...types, type],
      ]
    },
    [state, [], []],
  )

const findTypeVariable = <T extends AbstractState>(
  state: T,
  node: TypeVariableNode | TypeVariableDeclarationNameNode,
) => {
  const name = getTypeVariableName(node)
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
 * Given a node in the syntax tree and some state, returns the type defined by
 * the node.
 */
export const buildAliasType = <T extends AbstractState>(
  state: T,
  node: LocalTypeBindingNode,
): Return<T, DeclaredType> => {
  switch (node.type) {
    case SyntaxType.Class:
    case SyntaxType.TypeAlias:
      return handleTypeDeclaration(state, node.nameNode)
    case SyntaxType.Enum:
      return [state, [], handleTypeNode(node.nameNode)]
  }
}

const handleTypeNode = (node: TypeNode) =>
  buildGenericType(getTypeName(node), [])

const handleTypeDeclaration = <T extends AbstractState>(
  state: T,
  node: TypeDeclarationNode,
): Return<T, DeclaredType> => {
  const name = getTypeName(node.nameNode)
  const typeParameters = node.parameterNodes.map((child) =>
    findTypeVariable(state, child.nameNode),
  )
  return [state, [], buildGenericType(name, typeParameters)]
}

/**
 * Given a node in the syntax tree and some state, returns the type represented
 * by the type binding.
 */
export const buildAliasedType = <T extends AbstractState>(
  state: T,
  node: LocalTypeBindingNode,
): Return<T, Type> => {
  switch (node.type) {
    case SyntaxType.Class:
      return handleClass(state, node)
    case SyntaxType.Enum:
      return handleEnum(state, node)
    case SyntaxType.TypeAlias:
      return buildType(state, node.typeNode)
  }
}

const handleClass = <T extends AbstractState>(
  state: T,
  node: ClassNode,
): Return<T, Type> => {
  const [stateWithValues, deferredAssignments, memberTypes] = withState(
    state,
    node.memberNodes,
    handleClassMember,
  )
  return [stateWithValues, deferredAssignments, buildClassType(memberTypes)]
}

const handleEnum = <T extends AbstractState>(
  state: T,
  node: EnumNode,
): Return<T, Type> => {
  const [stateWithValues, deferredAssignments, valueTypes] = withState(
    state,
    node.valueNodes,
    handleEnumValue,
  )
  return [stateWithValues, deferredAssignments, buildUnionType(valueTypes)]
}

/**
 * Given a node in the syntax tree and some state, returns the type represented
 * by the node.
 */
export const buildType = <T extends AbstractState>(
  state: T,
  node: InternalTypeNode,
): Return<T, Type> => {
  switch (node.type) {
    case SyntaxType.AccessType:
      return handleAccessType(state, node)
    case SyntaxType.ConditionalType:
      return handleConditionalType(state, node)
    case SyntaxType.CurriedType:
      return handleCurriedType(state, node)
    case SyntaxType.IntersectionType:
      return handleIntersectionType(state, node)
    case SyntaxType.Keyof:
      return handleKeyof(state, node)
    case SyntaxType.ListType:
      return handleListType(state, node)
    case SyntaxType.MapType:
      return handleMapType(state, node)
    case SyntaxType.ParametricType:
      return handleParametricType(state, node)
    case SyntaxType.RefinementType:
      throw new NotImplementedError('Tony cannot build refinement types yet.')
    case SyntaxType.RefinementTypeDeclaration:
      throw new NotImplementedError('Tony cannot build refinement types yet.')
    case SyntaxType.StructType:
      return handleStructType(state, node)
    case SyntaxType.SubtractionType:
      return handleSubtractionType(state, node)
    case SyntaxType.TaggedType:
      return handleTaggedType(state, node)
    case SyntaxType.TupleType:
      return handleTupleType(state, node)
    case SyntaxType.TypeGroup:
      return handleTypeGroup(state, node)
    case SyntaxType.TypeVariable:
      return handleTypeVariable(state, node)
    case SyntaxType.Typeof:
      return handleTypeof(state, node)
    case SyntaxType.UnionType:
      return handleUnionType(state, node)
  }
}

/**
 * Given nodes in the syntax tree and some state, returns the types represented
 * by the nodes.
 */
export const buildTypes = <T extends AbstractState>(
  state: T,
  nodes: InternalTypeNode[],
): Return<T, Type[]> => withState(state, nodes, buildType)

const handleAccessType = <T extends AbstractState>(
  state: T,
  node: AccessTypeNode,
): Return<T, Type> => {
  const [stateWithType, deferredAssignmentsFromType, type] = buildType(
    state,
    node.typeNode,
  )
  const [
    stateWithProperty,
    deferredAssignmentsFromValue,
    propertyType,
  ] = handleTerm(stateWithType, node.valueNode)
  return [
    stateWithProperty,
    mergeDeferredAssignments(
      deferredAssignmentsFromType,
      deferredAssignmentsFromValue,
    ),
    buildAccessType(type, propertyType),
  ]
}

const handleConditionalType = <T extends AbstractState>(
  state: T,
  node: ConditionalTypeNode,
): Return<T, Type> => {
  const [stateWithType, deferredAssignmentsFromType, type] = buildType(
    state,
    node.typeNode,
  )
  const [
    stateWithConstraints,
    deferredAssignmentsFromConstraints,
    constraints,
  ] = buildTypes(stateWithType, node.constraintNodes)
  const [
    stateWithConsequence,
    deferredAssignmentsFromConsequence,
    consequence,
  ] = buildType(stateWithConstraints, node.consequenceNode)
  const [
    stateWithAlternative,
    deferredAssignmentsFromAlternative,
    alternative,
  ] = buildType(stateWithConsequence, node.alternativeNode)
  return [
    stateWithAlternative,
    mergeDeferredAssignments(
      deferredAssignmentsFromType,
      deferredAssignmentsFromConstraints,
      deferredAssignmentsFromConsequence,
      deferredAssignmentsFromAlternative,
    ),
    buildConditionalType(type, constraints, consequence, alternative),
  ]
}

const handleCurriedType = <T extends AbstractState>(
  state: T,
  node: CurriedTypeNode,
): Return<T, Type> => {
  const [stateWithFrom, deferredAssignmentsFromFrom, from] = buildType(
    state,
    node.fromNode,
  )
  const [stateWithTo, deferredAssignmentsFromTo, to] = buildType(
    stateWithFrom,
    node.toNode,
  )
  return [
    stateWithTo,
    mergeDeferredAssignments(
      deferredAssignmentsFromFrom,
      deferredAssignmentsFromTo,
    ),
    buildCurriedType(from, to),
  ]
}

const handleIntersectionType = <T extends AbstractState>(
  state: T,
  node: IntersectionTypeNode,
): Return<T, Type> => {
  const [stateWithLeft, deferredAssignmentsFromLeft, left] = buildType(
    state,
    node.leftNode,
  )
  const [stateWithRight, deferredAssignmentsFromRight, right] = buildType(
    stateWithLeft,
    node.rightNode,
  )
  return [
    stateWithRight,
    mergeDeferredAssignments(
      deferredAssignmentsFromLeft,
      deferredAssignmentsFromRight,
    ),
    flattenType(buildIntersectionType([left, right])),
  ]
}

const handleKeyof = <T extends AbstractState>(
  state: T,
  node: KeyofNode,
): Return<T, Type> => {
  const [stateWithType, deferredAssignments, type] = buildType(
    state,
    node.typeNode,
  )
  return [stateWithType, deferredAssignments, buildKeyof(type)]
}

const handleListType = <T extends AbstractState>(
  state: T,
  node: ListTypeNode,
): Return<T, Type> => {
  const [stateWithElement, deferredAssignments, element] = buildType(
    state,
    node.elementNode,
  )
  return [
    stateWithElement,
    deferredAssignments,
    buildObjectType([buildProperty(NUMBER_TYPE, element)]),
  ]
}

const handleMapType = <T extends AbstractState>(
  state: T,
  node: MapTypeNode,
): Return<T, Type> => {
  const [stateWithKey, deferredAssignmentsFromKey, key] = buildType(
    state,
    node.keyNode,
  )
  const [stateWithValue, deferredAssignmentsFromValue, value] = buildType(
    stateWithKey,
    node.valueNode,
  )
  return [
    stateWithValue,
    mergeDeferredAssignments(
      deferredAssignmentsFromKey,
      deferredAssignmentsFromValue,
    ),
    buildObjectType([buildProperty(key, value)]),
  ]
}

const handleParametricType = <T extends AbstractState>(
  state: T,
  node: ParametricTypeNode,
): Return<T, Type> => {
  const name = getTypeName(node.nameNode)
  if (isPrimitiveTypeName(name)) {
    const stateWithError = addErrorUnless<T>(
      node.argumentNodes.length === 0 && node.elementNodes.length === 0,
      buildPrimitiveTypeArgumentsError(),
    )(state, node)
    return [stateWithError, [], findPrimitiveType(name)]
  }

  const [
    stateWithTypeArguments,
    deferredAssignments,
    typeArguments,
  ] = buildTypes(state, node.argumentNodes)
  const termArguments = node.elementNodes
  return [
    stateWithTypeArguments,
    deferredAssignments,
    buildParametricType(name, typeArguments, termArguments),
  ]
}

const handleStructType = <T extends AbstractState>(
  state: T,
  node: StructTypeNode,
): Return<T, Type> => {
  const [stateWithMembers, deferredAssignments, properties] = withState(
    state,
    node.memberNodes,
    handleMemberType,
  )
  return [stateWithMembers, deferredAssignments, buildObjectType(properties)]
}

const handleSubtractionType = <T extends AbstractState>(
  state: T,
  node: SubtractionTypeNode,
): Return<T, Type> => {
  const [stateWithLeft, deferredAssignmentsFromLeft, left] = buildType(
    state,
    node.leftNode,
  )
  const [stateWithRight, deferredAssignmentsFromRight, right] = buildType(
    stateWithLeft,
    node.rightNode,
  )
  return [
    stateWithRight,
    mergeDeferredAssignments(
      deferredAssignmentsFromLeft,
      deferredAssignmentsFromRight,
    ),
    buildSubtractionType(left, right),
  ]
}

const handleTaggedType = <T extends AbstractState>(
  state: T,
  node: TaggedTypeNode,
): Return<T, Type> => {
  const tag = buildProperty(
    buildLiteralType('tag'),
    buildLiteralType(getIdentifierName(node.nameNode)),
  )
  if (node.typeNode === undefined) return [state, [], buildObjectType([tag])]

  const [stateWithValue, deferredAssignments, type] = buildType(
    state,
    node.typeNode,
  )
  const value = buildProperty(buildLiteralType('value'), type)
  return [stateWithValue, deferredAssignments, buildObjectType([tag, value])]
}

const handleTupleType = <T extends AbstractState>(
  state: T,
  node: TupleTypeNode,
): Return<T, Type> => {
  const [stateWithElements, deferredAssignments, elements] = buildTypes(
    state,
    node.elementNodes,
  )
  return [
    stateWithElements,
    deferredAssignments,
    buildObjectType(
      elements.map((element, i) => buildProperty(buildLiteralType(i), element)),
    ),
  ]
}

const handleTypeGroup = <T extends AbstractState>(
  state: T,
  node: TypeGroupNode,
): Return<T, Type> => buildType(state, node.typeNode)

const handleTypeVariable = <T extends AbstractState>(
  state: T,
  node: TypeVariableNode,
): Return<T, Type> => [state, [], findTypeVariable(state, node)]

const handleTypeof = <T extends AbstractState>(
  state: T,
  node: TypeofNode,
): Return<T, Type> => handleTerm(state, node.valueNode)

const handleUnionType = <T extends AbstractState>(
  state: T,
  node: UnionTypeNode,
): Return<T, Type> => {
  const [stateWithLeft, deferredAssignmentsFromLeft, left] = buildType(
    state,
    node.leftNode,
  )
  const [stateWithRight, deferredAssignmentsFromRight, right] = buildType(
    stateWithLeft,
    node.rightNode,
  )
  return [
    stateWithRight,
    mergeDeferredAssignments(
      deferredAssignmentsFromLeft,
      deferredAssignmentsFromRight,
    ),
    flattenType(buildUnionType([left, right])),
  ]
}

const handleClassMember = <T extends AbstractState>(
  state: T,
  node: ClassMemberNode,
): Return<T, Property<Type>> => {
  const [stateWithType, deferredAssignments, type] = buildType(
    state,
    node.typeNode,
  )
  return [
    stateWithType,
    deferredAssignments,
    buildProperty(buildLiteralType(getIdentifierName(node.nameNode)), type),
  ]
}

const handleEnumValue = <T extends AbstractState>(
  state: T,
  node: EnumValueNode,
  i: number,
): Return<T, Type> => {
  if (node.valueNode) return handleTerm(state, node.valueNode)
  return [state, [], buildLiteralType(i)]
}

const handleMemberType = <T extends AbstractState>(
  state: T,
  node: MemberTypeNode,
): Return<T, Property<Type>> => {
  const [stateWithValue, deferredAssignments, value] = buildType(
    state,
    node.valueNode,
  )
  return [
    stateWithValue,
    deferredAssignments,
    buildProperty(buildLiteralType(getIdentifierName(node.keyNode)), value),
  ]
}

const handleTerm = <T extends AbstractState>(
  state: T,
  node: ImmediateTermLevelNode,
): Return<T, Type> => {
  switch (node.type) {
    case SyntaxType.Boolean:
      return [state, [], BOOLEAN_TYPE]
    case SyntaxType.Number:
      return [state, [], NUMBER_TYPE]
    case SyntaxType.Regex:
      return [state, [], REG_EXP_TYPE]
    case SyntaxType.String:
      return [state, [], STRING_TYPE]
  }

  const typeVariable = buildTypeVariable()
  const name = getIdentifierName(node)
  const bindings = findBindings(name, state.scopes.map(getTerms))
  return [
    state,
    [buildDeferredTypeVariableAssignment(typeVariable, bindings)],
    typeVariable,
  ]
}
