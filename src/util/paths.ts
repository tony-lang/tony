import { AbsolutePath, Path } from '../types/paths'
import {
  FILE_EXTENSION,
  FILE_EXTENSION_REGEX,
  IMPORT_FILE_EXTENSIONS,
  TARGET_FILE_EXTENSION,
} from '../constants'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'

const fileExists = (file: AbsolutePath) => fs.existsSync(file.path)

const fileHasTonyExtension = (file: Path) =>
  FILE_EXTENSION_REGEX.test(file.path)

const fileHasImportExtension = (file: Path) =>
  !!IMPORT_FILE_EXTENSIONS.find((regex) => regex.test(file.path))

export const fileMayBeEntry = (file: AbsolutePath): boolean =>
  fileHasTonyExtension(file) && fileExists(file)

export const fileMayBeImported = (file: AbsolutePath): boolean =>
  fileHasImportExtension(file) && fileExists(file)

export const readFile = (file: AbsolutePath): Promise<string> =>
  new Promise((resolve, reject) =>
    fs.readFile(file.path, 'utf8', (error, data) =>
      !error ? resolve(data) : reject(error),
    ),
  )

export const writeFile = async (
  file: AbsolutePath,
  data = '',
): Promise<void> => {
  await mkdirp(path.dirname(file.path))

  return new Promise((resolve, reject) =>
    fs.writeFile(file.path, data, (error) =>
      !error ? resolve() : reject(error),
    ),
  )
}

export const getOutFilename = (filename: string): string =>
  filename.replace(FILE_EXTENSION, TARGET_FILE_EXTENSION)

export const isSamePath = (path1: AbsolutePath, path2: AbsolutePath): boolean =>
  path1.path === path2.path
