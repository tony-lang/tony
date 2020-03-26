import { TypeConstructor } from './TypeConstructor'
import { TypeInterface } from './TypeInterface'

export class ModuleType extends TypeInterface {
  private _propertyTypes: Map<string, TypeConstructor>

  constructor(propertyTypes: Map<string, TypeConstructor>) {
    super()

    this._propertyTypes = propertyTypes
  }

  get propertyTypes(): Map<string, TypeConstructor> {
    return this._propertyTypes
  }

  isValid = (): boolean => Array.from(this.propertyTypes.values())
    .every(propertyTypes => propertyTypes.isValid())

  toString = (): string => {
    const properties = Array.from(this.propertyTypes.entries())
      .map(([property, propertyTypes]) => {
        return `${property}: ${propertyTypes.toString()}`
      })
      .join(', ')

    return `{ ${properties} }`
  }
}
