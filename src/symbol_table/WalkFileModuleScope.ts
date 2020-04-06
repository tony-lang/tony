import { FileModuleScope, NestedScope } from './models'
import { assert } from '../errors'

export class WalkFileModuleScope {
  private _scope: NestedScope

  // tracks the progression through nested scopes within symbol table
  private _currentNestedScopeIndex = -1
  private _nestedScopesIndexStack: number[] = []

  constructor(fileScope: FileModuleScope) {
    this._scope = fileScope
  }

  get scope(): NestedScope {
    return this._scope
  }

  enterBlock = (): void => {
    this._nestedScopesIndexStack.push(this._currentNestedScopeIndex + 1)
    this._scope = this.scope.nestedScope(this._currentNestedScopeIndex + 1)
    this._currentNestedScopeIndex = -1
  }

  peekBlock = (): void => {
    this._nestedScopesIndexStack.push(this._currentNestedScopeIndex)
    this._scope = this.scope.nestedScope(this._currentNestedScopeIndex + 1)
    this._currentNestedScopeIndex = -1
  }

  leaveBlock = (): void => {
    assert(
      this.scope.parentScope instanceof NestedScope,
      'Cannot leave file-level scope.',
    )
    this._scope = this.scope.parentScope

    const nestedScopeIndex = this._nestedScopesIndexStack.pop()
    assert(
      nestedScopeIndex !== undefined,
      'Do not leave a block without entring it.',
    )
    this._currentNestedScopeIndex = nestedScopeIndex
  }
}
