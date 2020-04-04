import { TypeBinding } from './TypeBinding'
import { ParametricType } from '../../types'
import { ImportBinding } from './ImportBinding'

export class ImportTypeBinding extends TypeBinding implements ImportBinding {
  private _filePath: string
  private _originalType: ParametricType

  constructor(
    filePath: string,
    type: ParametricType,
    originalType: ParametricType,
  ) {
    super(type)

    this._filePath = filePath
    this._originalType = originalType
  }

  get filePath(): string {
    return this._filePath
  }

  get isImported(): boolean {
    return true
  }

  get originalName(): string {
    return this._originalType.name
  }

  set originalType(value: ParametricType) {
    this._originalType = value
  }
}
