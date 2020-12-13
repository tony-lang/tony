import { Binding, buildPrimitiveTypeBindings } from './bindings'
import { ErrorAnnotation, MountedErrorAnnotation } from '../errors/annotations'
import { AbsolutePath } from '../paths'
import { Answer } from '../type_inference/answers'
import { ProgramNode } from 'tree-sitter-tony'
import { SyntaxNode } from 'tree-sitter-tony'
import { TypeVariable } from './type_variables'

// ---- Types ----

enum ScopeKind {
  Global,
  File,
  Nested,
}

export interface ObjectScope {
  bindings: Binding[]
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
}

export interface NestedScope extends ConcreteScope {
  kind: typeof ScopeKind.Nested
  scopes: NestedScope[]
  node: SyntaxNode
  moduleName?: string
  typeVariables: TypeVariable[]
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
  bindings: buildPrimitiveTypeBindings(node),
  errors: [],
})

export const buildTypedFileScope = (
  fileScope: FileScope,
  typedNode: Answer<ProgramNode>,
): TypedFileScope => ({
  ...fileScope,
  typedNode,
})

export const buildNestedScope = (
  node: SyntaxNode,
  moduleName?: string,
): NestedScope => ({
  kind: ScopeKind.Nested,
  node,
  bindings: [],
  typeVariables: [],
  scopes: [],
  moduleName,
  errors: [],
})

export const isFileScope = (
  scope: FileScope | NestedScope,
): scope is FileScope => scope.kind === ScopeKind.File

export const isModuleScope = (scope: FileScope | NestedScope): boolean =>
  isFileScope(scope) || !!scope.moduleName
