import { NestedScope } from './NestedScope'

export abstract class Scope {
  protected _scopes: NestedScope[] = []
}
