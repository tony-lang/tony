import { InvalidUseOfTypeAsValueError, MissingBindingError } from '../../errors'
import { ModuleBinding, NestedScope } from '../../symbol_table'
import { ModuleType, ParametricType } from '../../types'

export class GetModuleTypeRepresentation {
  private _scope: NestedScope

  constructor(scope: NestedScope) {
    this._scope = scope
  }

  perform = (type: ParametricType): ModuleType => {
    const binding = this._scope.resolveBinding(type.name)

    if (binding === undefined) throw new MissingBindingError(type.name)
    else if (binding instanceof ModuleBinding) return binding.type
    else throw new InvalidUseOfTypeAsValueError(binding.name)
  }
}
