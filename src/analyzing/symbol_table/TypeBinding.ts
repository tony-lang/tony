import { ObjectRepresentation, ParametricType } from '../types'

import { Binding } from './Binding'

export class TypeBinding extends Binding {
  private _representation: ObjectRepresentation | undefined

  constructor(
    type: ParametricType,
    representation?: ObjectRepresentation,
    isImplicit = false,
    isExported = false,
  ) {
    super(type.name, type, isImplicit, isExported)

    this._representation = representation
  }

  get representation(): ObjectRepresentation | undefined {
    return this._representation
  }
}
