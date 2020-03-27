import Parser from 'tree-sitter'

import { ErrorHandler } from '../../error_handling'

import { TypeConstructor } from '../types'

import { Binding } from './Binding'
import { Scope } from './Scope'
import { SymbolTable } from './SymbolTable'

export class BuildSymbolTable {
  private _currentScope: Scope
  private _errorHandler: ErrorHandler
  private _symbolTable: SymbolTable

  private _exportBindings = false

  constructor(errorHandler: ErrorHandler) {
    this._errorHandler = errorHandler
  }

  get symbolTable(): SymbolTable {
    return this._symbolTable
  }

  initializeProgram = (): void => {
    this._symbolTable = new SymbolTable()
    this._currentScope = this.symbolTable
  }

  enterBlock = (): void => {
    this._currentScope = this._currentScope.createScope()
  }

  leaveBlock = (): void => {
    this._currentScope = this._currentScope.parentScope
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

  addBindings = (bindings: Binding[], context: Parser.SyntaxNode): void => {
    bindings.forEach(binding => {
      const matchingBinding = this._currentScope.resolveBinding(binding.name, 0)
      if (matchingBinding)
        this._errorHandler.throw(
          `A binding with name '${matchingBinding.name}' already exists in ` +
          'the current block',
          context
        )

      this._currentScope.addBinding(binding)
    })
  }

  addTypeBinding = (binding: Binding, context: Parser.SyntaxNode): void => {
    const matchingBinding = this._currentScope.resolveBinding(binding.name)
    if (matchingBinding)
      this._errorHandler.throw(
        `A type binding with name '${matchingBinding.name}' already exists ` +
        'in the current scope',
        context
      )

    this._currentScope.addBinding(binding)
  }

  resolveBinding = (name: string, node: Parser.SyntaxNode): Binding => {
    const binding = this._currentScope.resolveBinding(name)

    if (binding) return binding
    else this._errorHandler.throw(
      `Could not find '${name}' in current scope`,
      node
    )
  }

  getExportedBindingTypes = (): Map<string, TypeConstructor> =>
    this._currentScope.getExportedBindingTypes()
}
