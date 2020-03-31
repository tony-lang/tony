import { Type } from './Type'

export class UnificationError extends Error {
  left: Type
  right: Type

  constructor(left: Type, right: Type, message: string) {
    super(
      `${message}, when matching '${left.toString()}' with ` +
      `'${right.toString()}'.`
    )

    this.left = left
    this.right = right
  }
}
