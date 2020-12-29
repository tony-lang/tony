import { ErrorAnnotation, MountedErrorAnnotation } from '../errors/annotations'
import { TermBinding, TypeBinding, TypedTermBinding } from './bindings'
import { AbsolutePath } from '../path'
import { ProgramNode } from 'tree-sitter-tony'
import { SyntaxNode } from 'tree-sitter-tony'
import { TypedNode } from '../type_inference/nodes'

// ---- Types ----

enum ScopeKind {
  Global,
  File,
  Nested,
  RefinementType,
}

export type ObjectScope = {
  bindings: TermBinding[]
}

export type TypedObjectScope = {
  typedBindings: TypedTermBinding[]
}

export type ScopeWithTypes = ObjectScope & {
  typeBindings: TypeBinding[]
}

export type ScopeWithErrors = {
  errors: MountedErrorAnnotation[]
}

export type RecursiveScope<T> = {
  scopes: T[]
}

export type GlobalScope<
  T extends FileScope | TypedFileScope
> = RecursiveScope<T> & {
  kind: typeof ScopeKind.Global
  errors: ErrorAnnotation[]
}

export type FileScope = RecursiveScope<NestedScope> &
  ScopeWithTypes &
  ScopeWithErrors & {
    kind: typeof ScopeKind.File
    file: AbsolutePath
    node: ProgramNode
    dependencies: AbsolutePath[]
  }

export type TypedFileScope = FileScope &
  TypedObjectScope & {
    typedNode: TypedNode<ProgramNode>
  }

export interface NestedScope
  extends RecursiveScope<NestedScope>,
    ScopeWithTypes,
    ScopeWithErrors {
  kind: typeof ScopeKind.Nested
  node: SyntaxNode
}

// ---- Factories ----

export const buildGlobalScope = <T extends FileScope | TypedFileScope>(
  scopes: T[],
  errors: ErrorAnnotation[] = [],
): GlobalScope<T> => ({
  kind: ScopeKind.Global,
  scopes,
  errors,
})

export const buildFileScope = (
  file: AbsolutePath,
  node: ProgramNode,
): FileScope => ({
  kind: ScopeKind.File,
  file,
  node,
  scopes: [],
  dependencies: [],
  bindings: [],
  typeBindings: [],
  errors: [],
})

export const buildTypedFileScope = (
  fileScope: FileScope,
  typedNode: TypedNode<ProgramNode>,
  typedBindings: TypedTermBinding[],
): TypedFileScope => ({
  ...fileScope,
  typedNode,
  typedBindings,
})

export const buildNestedScope = (node: SyntaxNode): NestedScope => ({
  kind: ScopeKind.Nested,
  node,
  bindings: [],
  typeBindings: [],
  scopes: [],
  errors: [],
})

export const isFileScope = <T extends FileScope>(
  scope: T | NestedScope,
): scope is T => scope.kind === ScopeKind.File
