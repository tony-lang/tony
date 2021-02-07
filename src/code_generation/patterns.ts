import {
  DestructuringPatternNode,
  IdentifierPatternNode,
  ListPatternNode,
  MemberPatternNode,
  PatternGroupNode,
  RestNode,
  ShorthandMemberPatternNode,
  StructPatternNode,
  SyntaxType,
  TuplePatternNode,
} from 'tree-sitter-tony'
import { LiteralNode, PatternNode, TermNode } from '../types/nodes'
import { NotImplementedError, assert } from '../types/errors/internal'
import {
  generateIdentifierPattern,
  generateListPattern,
  generateMember,
  generateShorthandMemberPattern,
  generateStructPattern,
} from './generators'
import { State } from './types'
import { TypedNode } from '../types/type_inference/nodes'
import { generateDeclaredBindingName } from './bindings'

export type GeneratedPattern = [
  pattern: string,
  identifiersPattern: string,
  defaultsPattern: string,
]
export type GeneratedPatterns = [
  patterns: string[],
  identifiersPatterns: string[],
  defaultsPatterns: string[],
]

type Return = [pattern: string, identifiers: string[], defaults: string[]]
type GenerateCode = (state: State, typedNode: TypedNode<TermNode>) => string

export const generatePatterns = (
  state: State,
  typedNodes: TypedNode<PatternNode>[],
  generateCode: GenerateCode,
): GeneratedPatterns =>
  typedNodes.reduce<GeneratedPatterns>(
    ([patterns, identifiersPatterns, defaultsPatterns], typedNode) => {
      const [pattern, identifiersPattern, defaultsPattern] = generatePattern(
        state,
        typedNode,
        generateCode,
      )
      return [
        [...patterns, pattern],
        [...identifiersPatterns, identifiersPattern],
        [...defaultsPatterns, defaultsPattern],
      ]
    },
    [[], [], []],
  )

export const generatePattern = (
  state: State,
  typedNode: TypedNode<PatternNode>,
  generateCode: GenerateCode,
): GeneratedPattern => {
  const [pattern, identifiers, defaults] = traverse(
    state,
    typedNode,
    generateCode,
  )
  return [
    pattern,
    generateListPattern(identifiers),
    generateListPattern(defaults),
  ]
}

const traverseAll = (
  state: State,
  typedNodes: TypedNode<PatternNode>[],
  generateCode: GenerateCode,
) =>
  typedNodes.reduce<
    [patterns: string[], identifiers: string[], defaults: string[]]
  >(
    ([patterns, identifiers, defaults], typedNode) => {
      const [pattern, newIdentifiers, newDefaults] = traverse(
        state,
        typedNode,
        generateCode,
      )
      return [
        [...patterns, pattern],
        [...identifiers, ...newIdentifiers],
        [...defaults, ...newDefaults],
      ]
    },
    [[], [], []],
  )

const safeTraverse = (
  state: State,
  typedNode: TypedNode<PatternNode> | undefined,
  generateCode: GenerateCode,
): [pattern: string | undefined, identifiers: string[], defaults: string[]] =>
  typedNode ? traverse(state, typedNode, generateCode) : [undefined, [], []]

export const traverse = (
  state: State,
  typedNode: TypedNode<PatternNode>,
  generateCode: GenerateCode,
): Return => {
  switch (typedNode.node.type) {
    case SyntaxType.DestructuringPattern:
      return handleDestructuringPattern(
        state,
        typedNode as TypedNode<DestructuringPatternNode>,
        generateCode,
      )
    case SyntaxType.IdentifierPattern:
      return handleIdentifierPattern(
        state,
        typedNode as TypedNode<IdentifierPatternNode>,
        generateCode,
      )
    case SyntaxType.ListPattern:
      return handleListPattern(
        state,
        typedNode as TypedNode<ListPatternNode>,
        generateCode,
      )
    case SyntaxType.MemberPattern:
      return handleMemberPattern(
        state,
        typedNode as TypedNode<MemberPatternNode>,
        generateCode,
      )
    case SyntaxType.PatternGroup:
      return traverse(
        state,
        (typedNode as TypedNode<PatternGroupNode>).patternNode,
        generateCode,
      )
    case SyntaxType.Rest:
      return traverse(
        state,
        (typedNode as TypedNode<RestNode>).nameNode,
        generateCode,
      )
    case SyntaxType.ShorthandMemberPattern:
      return handleShorthandMemberPattern(
        state,
        typedNode as TypedNode<ShorthandMemberPatternNode>,
        generateCode,
      )
    case SyntaxType.StructPattern:
      return handleStructPattern(
        state,
        typedNode as TypedNode<StructPatternNode>,
        generateCode,
      )
    case SyntaxType.TaggedPattern:
      throw new NotImplementedError(
        'Tony cannot generate code for tagged patterns yet.',
      )
    case SyntaxType.TuplePattern:
      return handleTuplePattern(
        state,
        typedNode as TypedNode<TuplePatternNode>,
        generateCode,
      )

    case SyntaxType.Boolean:
    case SyntaxType.Number:
    case SyntaxType.RawString:
    case SyntaxType.Regex:
      return handleLiteralPattern(
        state,
        typedNode as TypedNode<LiteralNode>,
        generateCode,
      )
  }
}

const handleDestructuringPattern = (
  state: State,
  typedNode: TypedNode<DestructuringPatternNode>,
  generateCode: GenerateCode,
): Return => {
  const name = generateDeclaredBindingName(
    state.scopes[0].terms,
    typedNode.node,
  )
  if (name !== undefined)
    throw new NotImplementedError(
      'Tony cannot generate code for destructuring patterns with bindings yet.',
    )
  return traverse(state, typedNode.patternNode, generateCode)
}

const handleIdentifierPattern = (
  state: State,
  typedNode: TypedNode<IdentifierPatternNode>,
  generateCode: GenerateCode,
): Return => {
  const name = generateDeclaredBindingName(
    state.scopes[0].terms,
    typedNode.node,
  )
  assert(
    name !== undefined,
    'Identifier pattern nodes should always have an associated binding.',
  )
  return [
    generateIdentifierPattern(),
    [name],
    [typedNode.defaultNode ? generateCode(state, typedNode.defaultNode) : ''],
  ]
}

const handleListPattern = (
  state: State,
  typedNode: TypedNode<ListPatternNode>,
  generateCode: GenerateCode,
): Return => {
  const [elementPatterns, elementIdentifiers, elementDefaults] = traverseAll(
    state,
    typedNode.elementNodes,
    generateCode,
  )
  const [restPattern, restIdentifiers, restDefaults] = safeTraverse(
    state,
    typedNode.restNode,
    generateCode,
  )
  return [
    generateListPattern(elementPatterns, restPattern),
    [...elementIdentifiers, ...restIdentifiers],
    [...elementDefaults, ...restDefaults],
  ]
}

const handleLiteralPattern = (
  state: State,
  typedNode: TypedNode<LiteralNode>,
  generateCode: GenerateCode,
): Return => [generateCode(state, typedNode), [], []]

const handleMemberPattern = (
  state: State,
  typedNode: TypedNode<MemberPatternNode>,
  generateCode: GenerateCode,
): Return => {
  const key = generateCode(state, typedNode.keyNode)
  const [valuePattern, valueIdentifiers, valueDefaults] = traverse(
    state,
    typedNode.valueNode,
    generateCode,
  )
  return [generateMember(key, valuePattern), valueIdentifiers, valueDefaults]
}

const handleShorthandMemberPattern = (
  state: State,
  typedNode: TypedNode<ShorthandMemberPatternNode>,
  generateCode: GenerateCode,
): Return => {
  const name = generateDeclaredBindingName(
    state.scopes[0].terms,
    typedNode.node,
  )
  const value = generateDeclaredBindingName(
    state.scopes[0].terms,
    typedNode.node,
    true,
  )
  assert(
    name !== undefined && value !== undefined,
    'Shorthand member pattern nodes should always have an associated binding.',
  )
  return [
    generateShorthandMemberPattern(name, value),
    [name],
    [typedNode.defaultNode ? generateCode(state, typedNode.defaultNode) : ''],
  ]
}

const handleStructPattern = (
  state: State,
  typedNode: TypedNode<StructPatternNode>,
  generateCode: GenerateCode,
): Return => {
  const [memberPatterns, memberIdentifiers, memberDefaults] = traverseAll(
    state,
    typedNode.memberNodes,
    generateCode,
  )
  const [restPattern, restIdentifiers, restDefaults] = safeTraverse(
    state,
    typedNode.restNode,
    generateCode,
  )
  return [
    generateStructPattern(memberPatterns, restPattern),
    [...memberIdentifiers, ...restIdentifiers],
    [...memberDefaults, ...restDefaults],
  ]
}

const handleTuplePattern = (
  state: State,
  typedNode: TypedNode<TuplePatternNode>,
  generateCode: GenerateCode,
): Return => {
  const [elementPatterns, elementIdentifiers, elementDefaults] = traverseAll(
    state,
    typedNode.elementNodes,
    generateCode,
  )
  const [restPattern, restIdentifiers, restDefaults] = safeTraverse(
    state,
    typedNode.restNode,
    generateCode,
  )
  return [
    generateListPattern(elementPatterns, restPattern),
    [...elementIdentifiers, ...restIdentifiers],
    [...elementDefaults, ...restDefaults],
  ]
}
