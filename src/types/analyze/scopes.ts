import { Program } from './ast'
import { Binding } from './bindings'
import { Path } from '..'
import { Answer } from '../type_inference/answers'

// ---- Types ----

enum ScopeKind {
  Global,
  File,
  Nested,
}

// a concrete scope represents a scope including bindings
export interface ConcreteScope {
  bindings: Binding[]
}

export interface GlobalScope<T extends FileScope | TypedFileScope> {
  kind: typeof ScopeKind.Global
  scopes: T[]
}

export interface FileScope extends ConcreteScope {
  kind: typeof ScopeKind.File
  filePath: Path
  node: Program
  scopes: NestedScope[]
  dependencies: Path[]
}

export interface TypedFileScope extends FileScope {
  typedNode: Answer<Program>
}

export interface NestedScope extends ConcreteScope {
  kind: typeof ScopeKind.Nested
  scopes: NestedScope[]
  isModule: boolean
}

export type Scope<T extends FileScope> =
  | GlobalScope<T>
  | FileScope
  | TypedFileScope
  | NestedScope

// ---- Factories ----

export const buildGlobalScope = <T extends FileScope | TypedFileScope>(
  scopes: T[],
): GlobalScope<T> => ({
  kind: ScopeKind.Global,
  scopes,
})

export const buildFileScope = (
  filePath: Path,
  node: Program,
  scopes: NestedScope[] = [],
  dependencies: Path[] = [],
  bindings: Binding[] = [],
): FileScope => ({
  kind: ScopeKind.File,
  filePath,
  node,
  scopes,
  dependencies,
  bindings,
})

export const buildNestedScope = (
  bindings: Binding[] = [],
  scopes: NestedScope[] = [],
  isModule = false,
): NestedScope => ({
  kind: ScopeKind.Nested,
  bindings,
  scopes,
  isModule,
})
