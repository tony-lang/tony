import { SyntaxNode } from 'tree-sitter-tony'
import { ErrorAnnotation } from '../errors/annotations'

enum NodeKind {
  SyntaxError,
  Program,
}

interface AbstractNode {
  node: SyntaxNode
  errors: ErrorAnnotation[]
}

export interface SyntaxError extends AbstractNode {
  kind: typeof NodeKind.SyntaxError
}

export interface Program extends AbstractNode {
  kind: typeof NodeKind.Program
  expressions: Expression[]
}

export type Expression = never

export type Node = SyntaxError | Program
