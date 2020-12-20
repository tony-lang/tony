import { RawStringNode } from 'tree-sitter-tony'

export const parseStringPattern = (node: RawStringNode): string =>
  eval(node.text)
