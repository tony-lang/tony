import * as Declaration from 'tree-sitter-tony/dtn'
import * as Source from 'tree-sitter-tony/tony'

export const parseRawString = (
  node: Declaration.RawStringNode | Source.RawStringNode,
): string => eval(node.text)

export const getIdentifierName = (
  node:
    | Declaration.IdentifierNode
    | Source.IdentifierNode
    | Declaration.IdentifierPatternNameNode
    | Source.IdentifierPatternNameNode
    | Declaration.ShorthandMemberIdentifierNode
    | Source.ShorthandMemberIdentifierNode,
): string => node.text

export const getTypeName = (
  node: Declaration.TypeNode | Source.TypeNode,
): string => node.text

export const getTypeVariableName = (
  node:
    | Declaration.TypeVariableNode
    | Source.TypeVariableNode
    | Declaration.TypeVariableDeclarationNameNode
    | Source.TypeVariableDeclarationNameNode,
): string => node.text
