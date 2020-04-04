import { ImportBinding } from '../../symbol_table/models'
import { TransformIdentifier } from './TransformIdentifier'
import {
  FILE_EXTENSION_REGEX,
  JAVASCRIPT_FILE_EXTENSION_REGEX,
} from '../../constants'
import { InternalError } from '../../errors'

export class TransformImport {
  protected _transformIdentifier: TransformIdentifier

  constructor(transformIdentifier: TransformIdentifier) {
    this._transformIdentifier = transformIdentifier
  }

  perform = (sourcePath: string, bindings: ImportBinding[]): string => {
    if (FILE_EXTENSION_REGEX.test(sourcePath))
      return this.handleInternal(sourcePath, bindings)
    else if (JAVASCRIPT_FILE_EXTENSION_REGEX.test(sourcePath))
      return this.handleJavaScript(sourcePath, bindings)

    throw new InternalError(
      'Unsupported external imports should have been catched earlier.',
    )
  }

  private handleInternal = (
    sourcePath: string,
    bindings: ImportBinding[],
    suffix?: string,
  ): string => {
    const aliases = bindings
      .filter((binding) => binding.filePath === sourcePath)
      .map((binding) => {
        const originalName = this._transformIdentifier.perform(
          binding.originalName,
        )
        const name = this._transformIdentifier.perform(binding.name)

        return `${originalName} as ${name}${suffix ? suffix : ''}`
      })
      .join(',')

    return `import {${aliases}} from '${sourcePath}'`
  }

  private handleJavaScript = (
    sourcePath: string,
    bindings: ImportBinding[],
  ): string => {
    const importStatement = this.handleInternal(sourcePath, bindings, 'EXT')
    const currying = bindings
      .map((binding) => {
        const tmpName = `${this._transformIdentifier.perform(binding.name)}EXT`
        const name = this._transformIdentifier.perform(binding.name)

        return `${name}=stdlib.Curry.external(${tmpName})`
      })
      .join(',')
    const combinedCurrying = bindings.length > 0 ? `const ${currying}` : ''

    return `${importStatement};${combinedCurrying}`
  }
}
