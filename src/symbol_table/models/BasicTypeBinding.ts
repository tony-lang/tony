import { Binding } from './Binding'
import { ParametricType } from '../../types'

export class BasicTypeBinding implements Binding {
  private _type: ParametricType

  constructor(type: ParametricType) {
    this._type = type
  }

  get isExported(): boolean {
    return false
  }

  get isImplicit(): boolean {
    return false
  }

  get isImported(): boolean {
    return false
  }

  get name(): string {
    return this._type.name
  }
}
