import { Property } from './Property'

export enum RepresentationKind {
  Instance,
  Interface,
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

  // @ts-ignore
  // concat = (representation: Representation): Representation => {
  //   assert(this._kind === representation._kind, 'Only representations of the same kind may be concatenated.')

  //   return new Representation(this._kind, [...this.properties, ...representation.properties])
  // }

  toString = (): string => {
    if (this.properties.length == 0) return '{}'

    const properties = this.properties
      .map((property) => property.toString())
      .join(', ')

    return `{ ${properties} }`
  }
}
