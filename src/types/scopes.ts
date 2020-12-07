import { Node, Program } from './ast'
import { Binding } from './bindings'
import { Path } from './util'

export enum ScopeKind {
  Global,
  File,
  Nested,
}

export interface GlobalScope {
  kind: typeof ScopeKind.Global
  scopes: FileScope[]
}

export interface FileScope extends ConcreteScope {
  kind: typeof ScopeKind.File
  parentScope: GlobalScope
  scopes: NestedScope[]
  filePath: Path
  dependencies: Path[]
  node: Program
}

export interface NestedScope extends ConcreteScope {
  kind: typeof ScopeKind.Nested
  parentScope: FileScope | NestedScope
  scopes: NestedScope[]
  node: Node
}

export type Scope = GlobalScope | FileScope | NestedScope

// a concrete scope represents a scope including bindings
export interface ConcreteScope {
  bindings: Binding
}
