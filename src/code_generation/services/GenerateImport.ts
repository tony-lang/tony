import {
  FILE_EXTENSION,
  FILE_EXTENSION_REGEX,
  JAVASCRIPT_FILE_EXTENSION_REGEX,
  TARGET_FILE_EXTENSION,
} from '../../constants'
import { ImportBinding } from '../../symbol_table/models'
import { InternalError } from '../../errors'

const EXTERNAL_IMPORT_SUFFIX = Object.freeze('_EXT')

export class GenerateImport {
  perform = (sourcePath: string, bindings: ImportBinding[]): string => {
    if (FILE_EXTENSION_REGEX.test(sourcePath))
      return this.handleImport(sourcePath, bindings)
    else if (JAVASCRIPT_FILE_EXTENSION_REGEX.test(sourcePath))
      return this.handleJavaScript(sourcePath, bindings)

    throw new InternalError(
      'Unsupported external imports should have been catched earlier.',
    )
  }

  private handleImport = (
    sourcePath: string,
    bindings: ImportBinding[],
    suffix?: string,
    transformOriginalName = true,
  ): string => {
    const compiledSourcePath = GenerateImport.getCompiledSourcePath(sourcePath)
    const aliases = bindings
      .map((binding) => {
        const originalName = transformOriginalName
          ? binding.transformedOriginalName
          : binding.originalName
        const name = binding.transformedName

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
    const importStatement = this.handleImport(
      sourcePath,
      bindings,
      EXTERNAL_IMPORT_SUFFIX,
      false,
    )
    const currying = bindings
      .map((binding) => {
        const tmpName = `${binding.transformedName}${EXTERNAL_IMPORT_SUFFIX}`
        const name = binding.transformedName

        return `${name}=stdlib.Curry.external(${tmpName})`
      })
      .join(',')
    const combinedCurrying = bindings.length > 0 ? `const ${currying}` : ''

    return `${importStatement};${combinedCurrying}`
  }

  private static getCompiledSourcePath = (sourcePath: string): string =>
    sourcePath.replace(FILE_EXTENSION, TARGET_FILE_EXTENSION)
}
