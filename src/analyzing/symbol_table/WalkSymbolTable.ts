import { Scope } from './Scope'
import { SymbolTable } from './SymbolTable'

export class WalkSymbolTable {
  private _currentScope: Scope
  // tracks the progression through nested scopes within symbol table
  private _nestedScopesIndexStack = [0]

  constructor(symbolTable: SymbolTable) {
    this._currentScope = symbolTable
  }

  get currentScope(): Scope {
    return this._currentScope
  }

  enterBlock = (): void => {
    const currentNestedScopeIndex = this._nestedScopesIndexStack.pop()
    this._currentScope = this.currentScope.nestedScope(currentNestedScopeIndex)
    this._nestedScopesIndexStack.push(currentNestedScopeIndex)
  }

  leaveBlock = (): void => {
    this._currentScope = this.currentScope.parentScope
    this._nestedScopesIndexStack.push(this._nestedScopesIndexStack.pop() + 1)
  }
}
