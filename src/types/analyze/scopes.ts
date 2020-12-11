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

export interface SymbolTable extends ConcreteScope {
  kind: typeof ScopeKind.File
  scopes: NestedScope[]
  dependencies: Path[]
}

export interface GlobalScope<T extends FileScope | TypedFileScope> {
  kind: typeof ScopeKind.Global
  scopes: T[]
}

export interface FileScope extends SymbolTable {
  filePath: Path
  node: Program
}

export interface TypedFileScope extends FileScope {
  typedNode: Answer<Program>
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
): GlobalScope<T> => ({
  kind: ScopeKind.Global,
  scopes,
})

export const buildSymbolTable = (
  scopes: NestedScope[] = [],
  dependencies: Path[] = [],
  bindings: Binding[] = [],
): SymbolTable => ({
  kind: ScopeKind.File,
  scopes,
  dependencies,
  bindings,
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
  moduleName?: string,
  bindings: Binding[] = [],
  scopes: NestedScope[] = [],
): NestedScope => ({
  kind: ScopeKind.Nested,
  bindings,
  scopes,
  moduleName,
})

export const isSymbolTable = (
  scope: SymbolTable | NestedScope,
): scope is SymbolTable => scope.kind === ScopeKind.File

export const isModuleScope = (scope: SymbolTable | NestedScope) =>
  isSymbolTable(scope) || !!scope.moduleName
