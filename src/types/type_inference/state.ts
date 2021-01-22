import { RecursiveScope, ScopeWithErrors } from '../analyze/scopes'

interface Scope extends ScopeWithErrors, RecursiveScope<Scope> {}

export type State = {
  scopes: Scope[]
}
