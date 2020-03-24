import path from 'path'

import { FILE_EXTENSION, TARGET_FILE_EXTENSION } from '../constants'
import { getOutputPathForFile } from '../utilities'

export class GetImportSource {
  file: string
  private files: string[]
  private outputPath: string

  constructor(outputPath: string, files: string[]) {
    this.outputPath = outputPath
    this.files = files
  }

  perform = (source: string): string => {
    const dir = this.file.substring(0, this.file.lastIndexOf('/'))
    const pathToSource = path.join(dir, source)
    this.files.push(pathToSource)
    if (!source.endsWith(FILE_EXTENSION)) return source

    const pathToCompiledSource = path.join(
      getOutputPathForFile(this.outputPath, this.file),
      '..',
      source.replace(FILE_EXTENSION, TARGET_FILE_EXTENSION)
    )
    return pathToCompiledSource
  }
}
