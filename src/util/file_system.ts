import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import {
  FILE_EXTENSION,
  FILE_EXTENSION_REGEX,
  IMPORT_FILE_EXTENSIONS,
  TARGET_FILE_EXTENSION,
} from '../constants'
import { Path } from '../types'

const fileExists = (filePath: Path) => fs.existsSync(path.resolve(filePath))

const fileHasTonyExtension = (filePath: Path) =>
  FILE_EXTENSION_REGEX.test(filePath)

const fileHasImportExtension = (filePath: Path) =>
  !!IMPORT_FILE_EXTENSIONS.find((regex) => regex.test(filePath))

export const fileMayBeEntry = (filePath: Path) =>
  fileHasTonyExtension(filePath) && fileExists(filePath)

export const fileMayBeImported = (filePath: Path) =>
  fileHasImportExtension(filePath) && fileExists(filePath)

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

  // return buildPath(process.cwd(), filename)
  return buildPath(filename)
}

export const getOutFilename = (filename: string) =>
  filename.replace(FILE_EXTENSION, TARGET_FILE_EXTENSION)

export const buildPath: (...pathSegments: string[]) => Path = path.resolve

export const buildRelativePath = (filePath: Path, path: string): Path =>
  buildPath(filePath, '..', path)
