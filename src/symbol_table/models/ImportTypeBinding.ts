import { Representation, RepresentationKind } from '../../types/models'
import { ImportBinding } from './ImportBinding'
import { ParametricType } from '../../types'
import { TypeBinding } from './TypeBinding'

export class ImportTypeBinding extends TypeBinding implements ImportBinding {
  private _filePath: string
  private _originalType: ParametricType

  constructor(
    filePath: string,
    type: ParametricType,
    originalType: ParametricType,
  ) {
    super(type, new Representation(RepresentationKind.Unknown, []))

    this._filePath = filePath
    this._originalType = originalType
  }

  get filePath(): string {
    return this._filePath
  }

  get isImplicit(): boolean {
    return true
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

  get transformedOriginalName(): string {
    return this.originalName
  }
}
