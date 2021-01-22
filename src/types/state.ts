import { RecursiveScope, ScopeWithErrors } from './analyze/scopes'

export interface AbstractScope
  extends ScopeWithErrors,
    RecursiveScope<AbstractScope> {}

export type AbstractState = {
  scopes: AbstractScope[]
}
