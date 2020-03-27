import path from 'path'

import { FILE_EXTENSION, TARGET_FILE_EXTENSION } from '../constants'
import { getOutputPathForFile } from '../utilities'

import { Import, Alias } from './Import'

export class GetImport {
  private file: string
  private outputPath: string

  constructor(file: string, outputPath: string) {
    this.file = file
    this.outputPath = outputPath
  }

  perform = (relativePath: string, aliases: Alias[]): Import => {
    const dir = this.file.substring(0, this.file.lastIndexOf('/'))
    const fullPath = path.join(dir, relativePath)
    if (!relativePath.endsWith(FILE_EXTENSION))
      return { fullPath, relativePath, aliases }

    const relativePathAfterCompilation = path.join(
      getOutputPathForFile(this.outputPath, this.file),
      '..',
      relativePath.replace(FILE_EXTENSION, TARGET_FILE_EXTENSION)
    )
    return { fullPath, relativePath: relativePathAfterCompilation, aliases }
  }
}
