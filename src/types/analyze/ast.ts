import { SyntaxNode } from 'tree-sitter-tony'
import { CompileError } from '../errors/compile'

enum NodeKind {
  Error,
  Program,
}

interface AbstractNode {
  node: SyntaxNode
  errors: CompileError[]
}

export interface Error extends AbstractNode {
  kind: typeof NodeKind.Error
}

export interface Program extends AbstractNode {
  kind: typeof NodeKind.Program
  expressions: Expression[]
}

export type Expression = never

export type Node = Error | Program
