import { ObjectRepresentation, ParametricType } from '../types'

import { Binding } from './Binding'

export class TypeBinding extends Binding {
  protected _type: ParametricType
  private _representation: ObjectRepresentation

  constructor(
    type: ParametricType,
    representation?: ObjectRepresentation,
    isImplicit = false,
    isExported = false
  ) {
    super(type.name, type, isImplicit, isExported)

    this._representation = representation
  }

  get type(): ParametricType {
    return this._type
  }

  get representation(): ObjectRepresentation {
    return this._representation
  }
}
