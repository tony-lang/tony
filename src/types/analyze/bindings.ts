import { SyntaxNode } from 'tree-sitter-tony'
import { Path } from '..'
import { Node } from './ast'

export interface Binding {
  name: string
  syntaxNode: SyntaxNode
  isExported: boolean
  importedFrom?: Path
  // A binding is implicit when it stems from a generator, parameter or case,
  // but not when it stems from an assignment or a module.
  isImplicit: boolean
}

export interface AnnotatedBinding extends Binding {
  node: Node
}

export const buildBinding = (
  name: string,
  syntaxNode: SyntaxNode,
  isImplicit: boolean,
  isExported = false,
  importedFrom?: Path,
): Binding => ({
  name,
  syntaxNode,
  isExported,
  importedFrom,
  isImplicit,
})
