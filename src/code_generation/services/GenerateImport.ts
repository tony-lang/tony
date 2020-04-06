import {
  FILE_EXTENSION,
  FILE_EXTENSION_REGEX,
  JAVASCRIPT_FILE_EXTENSION_REGEX,
  TARGET_FILE_EXTENSION,
} from '../../constants'
import { ImportBinding } from '../../symbol_table/models'
import { InternalError } from '../../errors'
import { TransformIdentifier } from './TransformIdentifier'

const EXTERNAL_IMPORT_SUFFIX = Object.freeze('EXT_')

export class GenerateImport {
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
    const compiledSourcePath = sourcePath.replace(
      FILE_EXTENSION,
      TARGET_FILE_EXTENSION,
    )
    const aliases = bindings
      .map((binding) => {
        const originalName = this._transformIdentifier.perform(
          binding.originalName,
        )
        const name = this._transformIdentifier.perform(binding.name)

        return `${originalName} as ${name}${suffix ? suffix : ''}`
      })
      .join(',')

    return `import {${aliases}} from '${compiledSourcePath}'`
  }

  // eslint-disable-next-line max-lines-per-function
  private handleJavaScript = (
    sourcePath: string,
    bindings: ImportBinding[],
  ): string => {
    const importStatement = this.handleInternal(
      sourcePath,
      bindings,
      EXTERNAL_IMPORT_SUFFIX,
    )
    const currying = bindings
      .map((binding) => {
        const tmpName = `${this._transformIdentifier.perform(
          binding.name,
        )}${EXTERNAL_IMPORT_SUFFIX}`
        const name = this._transformIdentifier.perform(binding.name)

        return `${name}=stdlib.Curry.external(${tmpName})`
      })
      .join(',')
    const combinedCurrying = bindings.length > 0 ? `const ${currying}` : ''

    return `${importStatement};${combinedCurrying}`
  }
}
