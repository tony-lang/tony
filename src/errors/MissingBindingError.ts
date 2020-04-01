import { ObjectRepresentation, Type } from '../analyzing/types'

import { CompileError } from './CompileError'

export class MissingBindingError extends CompileError {
  private _name: string
  private _representation: ObjectRepresentation
  private _type: Type

  constructor(
    name: string,
    type?: Type,
    representation?: ObjectRepresentation
  ) {
    super(null)

    this._name = name
    this._type = type
    this._representation = representation
  }

  get name(): string {
    return this._name
  }

  get representation(): ObjectRepresentation {
    return this._representation
  }

  get type(): Type {
    return this._type
  }
}
