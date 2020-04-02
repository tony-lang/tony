import { Type, TypeVariable } from '../types'

import { Binding } from './Binding'
import { Import } from './Import'

export class ImportBinding extends Binding {
  private _originalName: string
  private _import: Import | undefined

  constructor(name: string, originalName: string, type?: Type) {
    super(name, type || new TypeVariable(), true, false)

    this._originalName = originalName
  }

  get originalName(): string {
    return this._originalName
  }

  get import(): Import | undefined {
    return this._import
  }

  set import(value: Import | undefined) {
    this._import = value
  }
}
