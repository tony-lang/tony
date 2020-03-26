import { TypeConstructor } from './TypeConstructor'
import { TypeInterface } from './TypeInterface'

export class ModuleType implements TypeInterface {
  private _propertyTypes: Map<string, TypeConstructor>

  constructor(propertyTypes: Map<string, TypeConstructor>) {
    this._propertyTypes = propertyTypes
  }

  get propertyTypes(): Map<string, TypeConstructor> {
    return this._propertyTypes
  }

  concat = (moduleType: ModuleType): ModuleType => new ModuleType(
    new Map([...this.propertyTypes, ...moduleType.propertyTypes])
  )

  matches = (pattern: TypeInterface): boolean => {
    if (!(pattern instanceof ModuleType)) return false

    return Array.from(pattern.propertyTypes.entries())
      .every(([property, propertyType]) => {
        return this.propertyTypes.has(property) &&
               this.propertyTypes.get(property).matches(propertyType)
      })
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
