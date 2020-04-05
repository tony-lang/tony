import { ParametricType } from './ParametricType'
import { Property } from './Property'
import { Representation } from './Representation'

export class TypeProperty implements Property {
  private _representation: Representation | undefined
  private _type: ParametricType

  constructor(type: ParametricType, representation?: Representation) {
    this._type = type
    this._representation = representation
  }

  get name(): string {
    return this.type.name
  }

  get representation(): Representation | undefined {
    return this._representation
  }

  get type(): ParametricType {
    return this._type
  }

  toString = (): string => {
    const type = this.type.toString()
    if (this.representation === undefined) return type

    const representation = this.representation.toString()
    return `${type}: ${representation}`
  }
}
