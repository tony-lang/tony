import { RawStringNode } from 'tree-sitter-tony'

export const parseRawString = (node: RawStringNode): string => eval(node.text)
