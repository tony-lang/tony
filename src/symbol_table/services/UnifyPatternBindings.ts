import { IdentifierBinding } from '../models'
import { MissingBindingError } from '../../errors'

export class UnifyPatternBindings {
  perform = (bindings: IdentifierBinding[][]): IdentifierBinding[] => {
    return bindings.reduce((acc, bindings) => {
      this.checkBindingMissing(acc, bindings)

      return acc.concat(bindings)
    })
  }

  checkBindingMissing = (
    a: IdentifierBinding[],
    b: IdentifierBinding[],
  ): void => {
    const missingBinding =
      a.find((binding) => !b.includes(binding)) ||
      b.find((binding) => !a.includes(binding))
    if (!missingBinding) return

    throw new MissingBindingError(missingBinding.name)
  }
}
