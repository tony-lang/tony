import { StringPatternNode } from 'tree-sitter-tony'

export const parseStringPattern = (node: StringPatternNode): string =>
  eval(node.text)
