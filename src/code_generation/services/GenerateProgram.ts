import { FileModuleScope, ImportBinding } from '../../symbol_table'
import { DEFAULT_IMPORTS } from '../../constants'
import { GenerateImport } from './GenerateImport'

export class GenerateProgram {
  private _generateImport: GenerateImport
  private _scope: FileModuleScope

  constructor(scope: FileModuleScope) {
    this._generateImport = new GenerateImport()
    this._scope = scope
  }

  perform = (expressions: string[]): string =>
    `${DEFAULT_IMPORTS};${this.generateImports()};${this.generateDeclarations()};${expressions.join(
      ';',
    )};${this.generateExports()}`

  private generateDeclarations = (): string => {
    const declarations = this._scope.bindings
      .filter((binding) => !binding.isImplicit)
      .map((binding) => binding.transformedName)

    return declarations.length > 0 ? `let ${declarations.join(',')}` : ''
  }

  private generateImports = (): string => {
    const importBindings = this._scope.bindings.filter(
      (binding) => binding.isImported,
    ) as ImportBinding[]

    return this._scope.dependencies
      .map((sourcePath) => {
        return this._generateImport.perform(
          sourcePath,
          importBindings.filter((binding) => binding.filePath === sourcePath),
        )
      })
      .join(';')
  }

  private generateExports = (): string => {
    const exports = this._scope.bindings
      .filter((binding) => binding.isExported)
      .map((binding) => `${binding.transformedName} as ${binding.name}`)

    return exports.length > 0 ? `export {${exports.join(',')}}` : ''
  }
}
