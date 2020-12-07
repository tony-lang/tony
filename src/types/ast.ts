import { SyntaxNode } from 'tree-sitter-tony'

export enum NodeKind {
  Program,
}

interface AbstractNode {
  node: SyntaxNode
}

export interface Program extends AbstractNode {
  kind: typeof NodeKind.Program
  expressions: Expression[]
}

export type Expression = never

export type Node = Program
