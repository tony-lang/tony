import { Binding } from './bindings'
import { Path } from '..'
import { Answer } from '../type_inference/answers'
import { ProgramNode } from 'tree-sitter-tony'
import { ErrorAnnotation, MountedErrorAnnotation } from '../errors/annotations'

// ---- Types ----

enum ScopeKind {
  Global,
  File,
  Nested,
}

// a concrete scope represents a scope including bindings
export interface ConcreteScope {
  bindings: Binding[]
  errors: MountedErrorAnnotation[]
}

export interface GlobalScope<T extends FileScope | TypedFileScope> {
  kind: typeof ScopeKind.Global
  scopes: T[]
  errors: ErrorAnnotation[]
}

export interface FileScope extends ConcreteScope {
  kind: typeof ScopeKind.File
  filePath: Path
  node: ProgramNode
  scopes: NestedScope[]
  dependencies: Path[]
}

export interface TypedFileScope extends FileScope {
  typedNode: Answer<ProgramNode>
}

export interface NestedScope extends ConcreteScope {
  kind: typeof ScopeKind.Nested
  scopes: NestedScope[]
  moduleName?: string
}

export type Scope<T extends FileScope> =
  | GlobalScope<T>
  | FileScope
  | TypedFileScope
  | NestedScope

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
  filePath: Path,
  node: ProgramNode,
  scopes: NestedScope[] = [],
  dependencies: Path[] = [],
  bindings: Binding[] = [],
  errors: MountedErrorAnnotation[] = [],
): FileScope => ({
  kind: ScopeKind.File,
  filePath,
  node,
  scopes,
  dependencies,
  bindings,
  errors,
})

export const buildNestedScope = (
  moduleName?: string,
  bindings: Binding[] = [],
  scopes: NestedScope[] = [],
  errors: MountedErrorAnnotation[] = [],
): NestedScope => ({
  kind: ScopeKind.Nested,
  bindings,
  scopes,
  moduleName,
  errors,
})

export const isFileScope = (
  scope: FileScope | NestedScope,
): scope is FileScope => scope.kind === ScopeKind.File

export const isModuleScope = (scope: FileScope | NestedScope) =>
  isFileScope(scope) || !!scope.moduleName
