import { Binding, ModuleScope, NestedScope } from '../../symbol_table'
import { TransformIdentifier } from './TransformIdentifier'

export class GenerateBlock {
  private _scope: NestedScope
  private _transformIdentifier: TransformIdentifier

  constructor(scope: NestedScope, transformIdentifier: TransformIdentifier) {
    this._scope = scope
    this._transformIdentifier = transformIdentifier
  }

  perform = (expressions: string[], endsWithReturn: boolean): string => {
    const isDeclaration = this._scope instanceof ModuleScope

    const bindings = this._scope.bindings.filter(
      (binding) => !binding.isImplicit,
    )
    const returnedDeclarations = bindings
      .filter((binding) => binding.isExported)
      .map((binding) => this._transformIdentifier.perform(binding.name))
      .join(',')

    const returnValue = isDeclaration
      ? `{${returnedDeclarations}}`
      : expressions.pop()
    const explicitReturn = isDeclaration || !endsWithReturn ? 'return ' : ''

    return (
      `(()=>{${this.generateDeclarations(bindings)};` +
      `${expressions.join(';')};${explicitReturn}${returnValue}})()`
    )
  }

  private generateDeclarations = (bindings: Binding[]): string => {
    const declarations = bindings.map((binding) =>
      this._transformIdentifier.perform(binding.name),
    )

    return declarations.length > 0 ? `let ${declarations.join(',')}` : ''
  }
}
