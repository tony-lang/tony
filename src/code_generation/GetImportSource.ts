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
    const dir = this.file.split('/').slice(0, -1).join('/')
    const pathToSource = path.join(dir, source)
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
