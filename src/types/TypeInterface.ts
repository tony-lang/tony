export abstract class TypeInterface {
  equals = (type: TypeInterface): boolean => this.toString() === type.toString()

  abstract isValid(): boolean
  abstract toString(): string
}
