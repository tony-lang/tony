import {
  DuplicateBindingError,
  MissingBindingError,
  assert,
} from '../../errors'

import { Binding } from './Binding'
import { Scope } from './Scope'
import { SymbolTable } from './SymbolTable'

export class BuildSymbolTable {
  private _currentScope: Scope
  private _symbolTable: SymbolTable

  // tracks if the next added bindings should be exported
  private _exportBindings = false

  constructor() {
    this._symbolTable = new SymbolTable()
    this._currentScope = this.symbolTable
  }

  get symbolTable(): SymbolTable {
    return this._symbolTable
  }

  get currentScope(): Scope {
    return this._currentScope
  }

  enterBlock = (): void => {
    this._currentScope = this._currentScope.createScope()
  }

  leaveBlock = (): void => {
    assert(
      this._currentScope.parentScope !== undefined,
      'Cannot leave top-level scope.',
    )

    this._currentScope = this._currentScope.parentScope
  }

  enterAbstraction = (): void => {
    this.enterBlock()
  }

  leaveAbstraction = (): void => {
    this.currentScope.reduce()
    this.leaveBlock()
  }

  enableExports = (): void => {
    this._exportBindings = true
  }

  disableExports = (): boolean => {
    const value = this._exportBindings

    // disables exports after bindings to be exported are identified
    this._exportBindings = false

    return value
  }

  addBindings = (bindings: Binding[]): void => bindings.forEach(this.addBinding)

  addBinding = (binding: Binding): void => {
    const matchingBinding = this._currentScope.resolveBinding(binding.name, 0)
    if (matchingBinding) throw new DuplicateBindingError(matchingBinding.name)

    this._currentScope.addBinding(binding)
  }

  resolveBinding = (name: string): Binding => {
    const binding = this._currentScope.resolveBinding(name)

    if (binding) return binding
    else throw new MissingBindingError(name)
  }
}
