import { Program } from './ast'
import { Binding } from './bindings'
import { Path } from '../util'
import { Answer } from '../type_inference/answers'

export enum ScopeKind {
  Global,
  File,
  Nested,
}

export interface GlobalScope<T extends FileScope> {
  kind: typeof ScopeKind.Global
  scopes: T[]
}

export interface FileScope extends ConcreteScope {
  kind: typeof ScopeKind.File
  parentScope: GlobalScope<FileScope>
  scopes: NestedScope[]
  filePath: Path
  dependencies: Path[]
  node: Program
}

export interface TypedFileScope extends FileScope {
  parentScope: GlobalScope<TypedFileScope>
  typedNode: Answer<Program>
}

export interface NestedScope extends ConcreteScope {
  kind: typeof ScopeKind.Nested
  parentScope: FileScope | NestedScope
  scopes: NestedScope[]
  isModule: boolean
}

export type Scope<T extends FileScope> =
  | GlobalScope<T>
  | FileScope
  | TypedFileScope
  | NestedScope

// a concrete scope represents a scope including bindings
export interface ConcreteScope {
  bindings: Binding
}
