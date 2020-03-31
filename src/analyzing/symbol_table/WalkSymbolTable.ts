import { Scope } from './Scope'
import { SymbolTable } from './SymbolTable'

export class WalkSymbolTable {
  private _currentScope: Scope

  // tracks the progression through nested scopes within symbol table
  private _currentNestedScopeIndex = -1
  private _nestedScopesIndexStack: number[] = []

  constructor(symbolTable: SymbolTable) {
    this._currentScope = symbolTable
  }

  get currentScope(): Scope {
    return this._currentScope
  }

  enterBlock = (): void => {
    this._nestedScopesIndexStack.push(this._currentNestedScopeIndex + 1)
    this._currentScope =
      this.currentScope.nestedScope(this._currentNestedScopeIndex + 1)
    this._currentNestedScopeIndex = -1
  }

  leaveBlock = (): void => {
    this._currentScope = this.currentScope.parentScope
    this._currentNestedScopeIndex = this._nestedScopesIndexStack.pop()
  }
}
