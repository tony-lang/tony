import { ObjectRepresentation, Type } from '../analyzing/types'

import { CompileError } from './CompileError'

export class MissingBindingError extends CompileError {
  private _binding: string
  private _representation: ObjectRepresentation
  private _type: Type

  constructor(
    binding: string,
    type?: Type,
    representation?: ObjectRepresentation
  ) {
    super(null)
    this.name = this.constructor.name

    this._binding = binding
    this._type = type
    this._representation = representation
  }

  get binding(): string {
    return this._binding
  }

  get representation(): ObjectRepresentation {
    return this._representation
  }

  get type(): Type {
    return this._type
  }
}
