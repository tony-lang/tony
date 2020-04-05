import { FileModuleScope, ImportBinding } from '../../symbol_table'
import { DEFAULT_IMPORTS } from '../../constants'
import { GenerateImport } from './GenerateImport'
import { TransformIdentifier } from './TransformIdentifier'

export class GenerateProgram {
  private _generateImport: GenerateImport
  private _scope: FileModuleScope
  private _transformIdentifier: TransformIdentifier

  constructor(
    scope: FileModuleScope,
    transformIdentifier: TransformIdentifier,
  ) {
    this._generateImport = new GenerateImport(transformIdentifier)
    this._scope = scope
    this._transformIdentifier = transformIdentifier
  }

  perform = (expressions: string[]): string =>
    `${DEFAULT_IMPORTS};${this.generateImports()};${this.generateDeclarations()};${expressions.join(
      ';',
    )};${this.generateExports()}`

  private generateDeclarations = (): string => {
    const declarations = this._scope.bindings
      .filter((binding) => !binding.isImplicit)
      .map((binding) => this._transformIdentifier.perform(binding.name))

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
      .map((binding) => this._transformIdentifier.perform(binding.name))

    return exports.length > 0 ? `export {${exports.join(',')}}` : ''
  }
}
