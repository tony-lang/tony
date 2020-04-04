import { NestedScope } from './NestedScope'

export abstract class Scope {
  protected _scopes: NestedScope[] = []

  get scopes(): NestedScope[] {
    return this._scopes
  }
}
