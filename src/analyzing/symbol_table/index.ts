import { BASIC_TYPES } from '../types'

import { Binding } from './Binding'
import { Scope } from './Scope'

export { BuildSymbolTable } from './BuildSymbolTable'
export { ResolvePatternBindings } from './ResolvePatternBindings'

export class SymbolTable extends Scope {
  // private imports: Import[] = []

  constructor() {
    super(null)
  }

  get exports(): Binding[] {
    return this.bindings.filter(binding => binding.isExported)
  }

  // addImport = (importNode: Parser.SyntaxNode): void => {
  //   // TODO: resolve import, bindings and add to scope
  // }

  resolveBinding = (name: string): Binding => {
    // TODO: remove this when basic types are implemented in Tony
    const matchingBasicType = BASIC_TYPES.find(type => type.toString() === name)
    if (matchingBasicType) return new Binding(name, matchingBasicType)

    const binding = this.bindings.find(binding => binding.name === name)
    if (binding) return binding

    return
  }
}

export { Binding, Scope }

// export class ImportBinding extends Binding {
//   private import: Import

//   constructor(name: string, type: TypeConstructor, imp: Import) {
//     super(name, type)

//     this.import = imp
//   }
// }

type Import = { fullPath: string; relativePath: string }
