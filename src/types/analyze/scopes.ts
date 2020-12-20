import { Bindings, TypedBindings, initializeBindings } from './bindings'
import { ErrorAnnotation, MountedErrorAnnotation } from '../errors/annotations'
import { AbsolutePath } from '../paths'
import { Answer } from '../type_inference/answers'
import { ProgramNode } from 'tree-sitter-tony'
import { SyntaxNode } from 'tree-sitter-tony'

// ---- Types ----

enum ScopeKind {
  Global,
  File,
  Nested,
  RefinementType,
}

export interface ObjectScope {
  bindings: Bindings
}

export interface ConcreteScope extends ObjectScope {
  errors: MountedErrorAnnotation[]
}

export interface GlobalScope<T extends FileScope | TypedFileScope> {
  kind: typeof ScopeKind.Global
  scopes: T[]
  errors: ErrorAnnotation[]
}

export interface FileScope extends ConcreteScope {
  kind: typeof ScopeKind.File
  file: AbsolutePath
  node: ProgramNode
  scopes: NestedScope[]
  dependencies: AbsolutePath[]
}

export interface TypedFileScope extends FileScope {
  typedNode: Answer<ProgramNode>
  typedBindings: TypedBindings
}

export interface NestedScope extends ConcreteScope {
  kind: typeof ScopeKind.Nested
  scopes: NestedScope[]
  node: SyntaxNode
}

export type Scope = GlobalScope<FileScope> | FileScope | NestedScope

export type TypedScope =
  | GlobalScope<TypedFileScope>
  | TypedFileScope
  | NestedScope

export type ScopeStack<T extends FileScope> = (T | NestedScope)[]

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
  bindings: initializeBindings(node),
  errors: [],
})

export const buildTypedFileScope = (
  fileScope: FileScope,
  typedNode: Answer<ProgramNode>,
  typedBindings: TypedBindings,
): TypedFileScope => ({
  ...fileScope,
  typedNode,
  typedBindings,
})

export const buildNestedScope = (node: SyntaxNode): NestedScope => ({
  kind: ScopeKind.Nested,
  node,
  bindings: initializeBindings(),
  scopes: [],
  errors: [],
})

export const isFileScope = <T extends FileScope>(
  scope: T | NestedScope,
): scope is T => scope.kind === ScopeKind.File
