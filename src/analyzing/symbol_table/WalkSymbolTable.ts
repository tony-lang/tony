import { Scope } from './Scope'
import { SymbolTable } from './SymbolTable'
import { assert } from '../../errors'

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
    this._currentScope = this.currentScope.nestedScope(
      this._currentNestedScopeIndex + 1,
    )
    this._currentNestedScopeIndex = -1
  }

  leaveBlock = (): void => {
    const currentScope = this.currentScope.parentScope
    assert(currentScope !== undefined, 'Cannot leave top-level block.')
    this._currentScope = currentScope

    const nestedScopeIndex = this._nestedScopesIndexStack.pop()
    assert(
      nestedScopeIndex !== undefined,
      'Do not leave a block without entring it.',
    )
    this._currentNestedScopeIndex = nestedScopeIndex
  }
}
