import { Property } from './Property'

export enum RepresentationKind {
  Instance,
  Interface,
  Unknown,
}

export class Representation {
  private _kind: RepresentationKind
  private _properties: Property[]

  constructor(kind: RepresentationKind, properties: Property[]) {
    this._kind = kind
    this._properties = properties
  }

  get properties(): Property[] {
    return this._properties
  }

  findProperty = (name: string): Property | undefined =>
    this.properties.find((property) => property.name === name)

  toString = (): string => {
    if (this.properties.length == 0) return '{}'

    const properties = this.properties
      .map((property) => property.toString())
      .join(', ')

    return `{ ${properties} }`
  }
}
