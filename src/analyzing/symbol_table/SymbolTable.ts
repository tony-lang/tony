import { BASIC_TYPES, ParametricType } from '../types'

import { Binding } from './Binding'
import { Import } from './Import'
import { Scope } from './Scope'
import { TypeBinding } from './TypeBinding'

export class SymbolTable extends Scope {
  private _imports: Import[] = []

  constructor() {
    super(undefined)
  }

  get imports(): Import[] {
    return this._imports
  }

  get importedFiles(): string[] {
    return this.imports.map(({ fullPath }) => fullPath)
  }

  addImport = (imp: Import): void => {
    this._imports = [imp, ...this.imports]

    imp.bindings.forEach((binding) => {
      binding.import = imp

      this.addBinding(binding)
    })
  }

  resolveBinding = (name: string): Binding | undefined => {
    // TODO: remove this when basic types are implemented in Tony
    const matchingBasicType = BASIC_TYPES.find((type) => type === name)
    if (matchingBasicType)
      return new TypeBinding(new ParametricType(matchingBasicType))

    const binding = this.bindings.find((binding) => binding.name === name)
    if (binding) return binding
  }
}
