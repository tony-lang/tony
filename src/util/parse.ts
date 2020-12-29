import {
  IdentifierNode,
  IdentifierPatternNameNode,
  RawStringNode,
  TypeNode,
  TypeVariableDeclarationNameNode,
  TypeVariableNode,
} from 'tree-sitter-tony'

export const parseRawString = (node: RawStringNode): string => eval(node.text)

export const getIdentifierName = (
  node: IdentifierNode | IdentifierPatternNameNode,
): string => node.text

export const getTypeName = (node: TypeNode): string => node.text

export const getTypeVariableName = (
  node: TypeVariableNode | TypeVariableDeclarationNameNode,
): string => node.text
