import { SyntaxNode } from 'tree-sitter-tony'
import { AbsolutePath } from '../paths'

// ---- Types ----

export interface Binding {
  name: string
  node: SyntaxNode
  isExported: boolean
  importedFrom?: AbsolutePath
  // A binding is implicit when it stems from a generator, parameter or case,
  // but not when it stems from an assignment or a module.
  isImplicit: boolean
}

// ---- Factories ----

export const buildBinding = (
  name: string,
  node: SyntaxNode,
  isImplicit: boolean,
  isExported = false,
  importedFrom?: AbsolutePath,
): Binding => ({
  name,
  node,
  isExported,
  importedFrom,
  isImplicit,
})
