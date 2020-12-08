import { Path } from '..'
import { Binding } from './bindings'
import { NestedScope } from './scopes'

export interface SymbolTable {
  scopes: NestedScope[]
  dependencies: Path[]
  bindings: Binding[]
}
