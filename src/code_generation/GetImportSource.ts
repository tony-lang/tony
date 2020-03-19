import path from 'path'

import { FILE_EXTENSION, TARGET_FILE_EXTENSION } from '../constants'
import { getOutputPathForFile } from '../utilities'

export class GetImportSource {
  private file: string
  private files: string[]
  private outputPath: string

  constructor(file: string, outputPath: string, files: string[]) {
    this.file = file
    this.outputPath = outputPath
    this.files = files
  }

  perform = (source: string): string => {
    const pathToSource = path.join(this.file, '..', source)
    if (!source.endsWith(FILE_EXTENSION)) return pathToSource

    const pathToCompiledSource = path.join(
      getOutputPathForFile(this.outputPath, this.file),
      '..',
      source.replace(FILE_EXTENSION, TARGET_FILE_EXTENSION)
    )
    this.files.push(pathToSource)
    return pathToCompiledSource
  }
}
