import Parser from 'tree-sitter'

import { PatternMatchType } from './PatternMatchType'
import { ParseType } from './ParseType'
import { TypeConstructor, BASIC_TYPES } from './types'

export class Scope {
  private _bindings: Binding[] = []
  private _parentScope: Scope
  private _scopes = new Map<Parser.SyntaxNode, Scope>()

  constructor(parentScope: Scope) {
    this._parentScope = parentScope
  }

  createScope = (node: Parser.SyntaxNode): Scope => {
    const scope = new Scope(this)

    this._scopes.set(node, scope)
    return scope
  }

  resolveBinding = (name: string): Binding => {
    // TODO: remove this when basic types are implemented in Tony
    if (BASIC_TYPES.includes(name)) return new Binding(name, null)

    const binding = this._bindings.find(binding => binding.name === name)
    if (binding) return binding

    return this._parentScope.resolveBinding(name)
  }

  addBindings = (bindings: Binding[]): void => {
    this._bindings = [...bindings, ...this._bindings]
  }

  buildBindings = (
    patternNode: Parser.SyntaxNode,
    typeNode: Parser.SyntaxNode,
    isExported = false
  ): Binding[] => {
    const type = ParseType.perform(typeNode)

    return new PatternMatchType(isExported).perform(patternNode, type)
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
    if (BASIC_TYPES.includes(name)) return new Binding(name, null)

    const binding = this.bindings.find(binding => binding.name === name)
    if (binding) return binding

    return null
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
