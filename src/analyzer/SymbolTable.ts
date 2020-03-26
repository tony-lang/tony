import { TypeConstructor, BasicType, BASIC_TYPES } from '../types'

export class Scope {
  private _bindings: Binding[] = []
  private _parentScope: Scope
  private _scopes: Scope[] = []

  constructor(parentScope: Scope) {
    this._parentScope = parentScope
  }

  createScope = (): Scope => {
    const scope = new Scope(this)

    this._scopes.push(scope)
    return scope
  }

  resolveBinding = (name: string, depth: number = null): Binding => {
    // TODO: remove this when basic types are implemented in Tony
    const matchingBasicType = BASIC_TYPES.find(type => type.toString() === name)
    if (matchingBasicType) return new Binding(name, matchingBasicType)

    const binding = this._bindings.find(binding => binding.name === name)
    if (binding) return binding

    if (depth === null) return this._parentScope.resolveBinding(name)
    else if (depth > 0) return this._parentScope.resolveBinding(name, depth - 1)
  }

  addBinding = (binding: Binding): void => {
    this._bindings = [binding, ...this._bindings]
  }

  getExportedBindingTypes = (): Map<string, TypeConstructor> => {
    const result = new Map<string, TypeConstructor>()

    this._bindings.forEach(binding => {
      if (!binding.isExported) return

      result.set(binding.name, binding.type)
    })

    return result
  }

  protected get bindings(): Binding[] {
    return this._bindings
  }

  get parentScope(): Scope {
    return this._parentScope
  }
}

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

export class Binding {
  private _name: string
  private _type: TypeConstructor
  private _isExported: boolean

  constructor(name: string, type: TypeConstructor, isExported = false) {
    this._name = name
    this._type = type
    this._isExported = isExported
  }

  get name(): string {
    return this._name
  }

  get type(): TypeConstructor {
    return this._type
  }

  get isExported(): boolean {
    return this._isExported
  }
}

// export class ImportBinding extends Binding {
//   private import: Import

//   constructor(name: string, type: TypeConstructor, imp: Import) {
//     super(name, type)

//     this.import = imp
//   }
// }

type Import = { fullPath: string; relativePath: string }
