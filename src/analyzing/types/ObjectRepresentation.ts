import { Type } from './Type'

type Property = {
  name: string
  type: Type
  representation?: ObjectRepresentation
}

export class ObjectRepresentation {
  private _properties: Property[]

  constructor(properties: Property[]) {
    this._properties = properties
  }

  get properties(): Property[] {
    return this._properties
  }

  findProperty = (name: string): Property | undefined =>
    this.properties.find(({ name: propertyName }) => propertyName === name)

  concat = (representation: ObjectRepresentation): ObjectRepresentation =>
    new ObjectRepresentation([...this.properties, ...representation.properties])

  isComplete = (): boolean =>
    this.properties.every(({ type, representation }) => {
      return (
        type.isComplete() &&
        (representation === undefined || representation.isComplete())
      )
    })

  toString = (): string => {
    const properties = this.properties
      .map(({ name, type, representation }) => {
        if (representation === undefined) return `${name}: ${type.toString()}`

        return `${type.toString()}: ${representation.toString()}`
      })
      .join(', ')

    return `{ ${properties} }`
  }
}
