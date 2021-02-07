import { PatternNode } from '../types/nodes'
import { TypedNode } from '../types/type_inference/nodes'

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

export const resolvePatterns = (
  typedNodes: TypedNode<PatternNode>[],
): GeneratedPatterns =>
  typedNodes.reduce<GeneratedPatterns>(
    ([patterns, identifiersPatterns, defaultsPatterns], typedNode) => {
      const [pattern, identifiersPattern, defaultsPattern] = resolvePattern(
        typedNode,
      )
      return [
        [...patterns, pattern],
        [...identifiersPatterns, identifiersPattern],
        [...defaultsPatterns, defaultsPattern],
      ]
    },
    [[], [], []],
  )

export const resolvePattern = (
  typedNode: TypedNode<PatternNode>,
): GeneratedPattern => {}

// const handleIdentifierPattern = (
//   state: State,
//   typedNode: TypedNode<IdentifierPatternNode>,
// ): string => {
//   const name = generateDeclaredBindingName(
//     state.scopes[0].terms,
//     typedNode.node,
//   )
//   assert(
//     name !== undefined,
//     'Identifier pattern nodes should always have an associated binding.',
//   )
//   return generateIdentifierPattern(name)
// }
