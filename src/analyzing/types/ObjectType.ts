import { TypeConstructor } from './TypeConstructor'
import { TypeInterface } from './TypeInterface'

export class ObjectType implements TypeInterface {
  private _propertyTypes: Map<string, TypeConstructor>

  constructor(propertyTypes: Map<string, TypeConstructor>) {
    this._propertyTypes = propertyTypes
  }

  get propertyTypes(): Map<string, TypeConstructor> {
    return this._propertyTypes
  }

  concat = (objectType: ObjectType): ObjectType => new ObjectType(
    new Map([...this.propertyTypes, ...objectType.propertyTypes])
  )

  matches = (pattern: TypeInterface): boolean => {
    if (!(pattern instanceof ObjectType)) return false

    return Array.from(pattern.propertyTypes.entries())
      .every(([property, propertyType]) => {
        if (this.propertyTypes.has(property))
          return this.propertyTypes.get(property).matches(propertyType)

        return propertyType.isOptional
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
