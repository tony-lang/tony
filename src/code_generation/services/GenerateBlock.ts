import { Binding, ModuleScope, NestedScope } from '../../symbol_table'

export class GenerateBlock {
  private _scope: NestedScope

  constructor(scope: NestedScope) {
    this._scope = scope
  }

  perform = (expressions: string[], endsWithReturn: boolean): string => {
    const isDeclaration = this._scope instanceof ModuleScope

    const bindings = this._scope.bindings.filter(
      (binding) => !binding.isImplicit,
    )
    const returnedDeclarations = bindings
      .filter((binding) => binding.isExported)
      .map((binding) => `${binding.name}:${binding.transformedName}`)
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
    const declarations = bindings.map((binding) => binding.transformedName)

    return declarations.length > 0 ? `let ${declarations.join(',')}` : ''
  }
}
