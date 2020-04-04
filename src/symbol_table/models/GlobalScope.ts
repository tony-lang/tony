import { Scope } from './Scope'
import { FileModuleScope } from './FileModuleScope'

export class GlobalScope extends Scope {
  constructor(scopes: FileModuleScope[] = []) {
    super()

    this._scopes = scopes
  }

  set scopes(value: FileModuleScope[]) {
    this._scopes = value
  }
}
