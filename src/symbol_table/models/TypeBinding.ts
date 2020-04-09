import { Binding } from './Binding'
import { ParametricType } from '../../types/models/ParametricType'
import { Representation } from '../../types/models/Representation'

export class TypeBinding implements Binding {
  private _isExported: boolean
  private _representation: Representation
  private _type: ParametricType

  constructor(
    type: ParametricType,
    representation: Representation,
    { isExported = false }: { isExported?: boolean } = { isExported: false },
  ) {
    this._isExported = isExported
    this._type = type
    this._representation = representation
  }

  get isExported(): boolean {
    return this._isExported
  }

  get isImplicit(): boolean {
    return false
  }

  get isImported(): boolean {
    return false
  }

  get name(): string {
    return this.type.name
  }

  get representation(): Representation {
    return this._representation
  }

  get type(): ParametricType {
    return this._type
  }

  get transformedName(): string {
    return this.name
  }
}
