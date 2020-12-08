import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import {
  FILE_EXTENSION,
  FILE_EXTENSION_REGEX,
  TARGET_FILE_EXTENSION,
} from '../constants'
import { Path } from '../types'

const fileExists = (filePath: Path) => fs.existsSync(path.resolve(filePath))

const fileHasTonyExtension = (filePath: Path) =>
  FILE_EXTENSION_REGEX.test(filePath)

export const fileMayBeImported = (filePath: Path) =>
  fileHasTonyExtension(filePath) && fileExists(filePath)

export const readFile = (filePath: string): Promise<string> =>
  new Promise((resolve, reject) =>
    fs.readFile(filePath, 'utf8', (error, data) =>
      !error ? resolve(data) : reject(error),
    ),
  )

export const writeFile = async (filePath: string, data = ''): Promise<void> => {
  await mkdirp(path.dirname(filePath))

  return new Promise((resolve, reject) =>
    fs.writeFile(filePath, data, (error) =>
      !error ? resolve() : reject(error),
    ),
  )
}

export const getFilePath = (filename: string): Path => {
  if (!filename.startsWith('.')) return filename

  return path.join(process.cwd(), filename)
}

export const getOutFilename = (filename: string) =>
  filename.replace(FILE_EXTENSION, TARGET_FILE_EXTENSION)
