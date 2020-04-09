import { IdentifierBinding } from './IdentifierBinding'
import { ImportBinding } from './ImportBinding'
import { Type } from '../../types'

export class ImportIdentifierBinding extends IdentifierBinding
  implements ImportBinding {
  private _filePath: string
  private _originalName: string

  constructor(
    filePath: string,
    name: string,
    originalName: string,
    type: Type,
  ) {
    super(name, type, { isImplicit: true })

    this._filePath = filePath
    this._originalName = originalName
  }

  get filePath(): string {
    return this._filePath
  }

  get isImported(): boolean {
    return true
  }

  get originalName(): string {
    return this._originalName
  }

  set originalName(value: string) {
    this._originalName = value
  }

  get transformedOriginalName(): string {
    return this.originalName
  }
}
