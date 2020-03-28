import { BASIC_TYPES } from '../types'

import { Binding } from './Binding'
import { Import } from './Import'
import { Scope } from './Scope'

export class SymbolTable extends Scope {
  private _imports: Import[] = []

  constructor() {
    super(null)
  }

  get imports(): Import[] {
    return this._imports
  }

  get importedFiles(): string[] {
    return this.imports.map(({ fullPath }) => fullPath)
  }

  get exports(): Binding[] {
    return this.bindings.filter(binding => binding.isExported)
  }

  addImport = (imp: Import): void => {
    this._imports = [imp, ...this.imports]

    imp.bindings.forEach(binding => {
      binding.import = imp

      this.addBinding(binding)
    })
  }

  resolveBinding = (name: string): Binding => {
    // TODO: remove this when basic types are implemented in Tony
    const matchingBasicType = BASIC_TYPES.find(type => type.toString() === name)
    if (matchingBasicType) return new Binding(name, matchingBasicType)

    const binding = this.bindings.find(binding => binding.name === name)
    if (binding) return binding

    return
  }
}
