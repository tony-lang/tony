import { FileModuleScope } from './FileModuleScope'
import { Scope } from './Scope'

export class GlobalScope extends Scope {
  constructor(scopes: FileModuleScope[] = []) {
    super()

    this._scopes = scopes
  }

  set scopes(value: FileModuleScope[]) {
    this._scopes = value
  }
}
