import { AbsolutePath, Path } from '../types/path'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'

const buildFileRegexFromExtension = (ext: string) =>
  new RegExp(`^(.+\\${ext}|[^.]+)$`)

const SOURCE_EXTENSION = '.tn'
const DECLARATION_EXTENSION = '.dtn'
const TARGET_EXTENSION = '.js'

const SOURCE_REGEX = buildFileRegexFromExtension(SOURCE_EXTENSION)
const DECLARATION_REGEX = buildFileRegexFromExtension(DECLARATION_EXTENSION)

export const fileExists = (file: AbsolutePath): boolean =>
  fs.existsSync(file.path)

export const isSourceFile = (file: Path): boolean =>
  SOURCE_REGEX.test(file.path)

export const isDeclarationFile = (file: Path): boolean =>
  DECLARATION_REGEX.test(file.path)

const fileHasImportExtension = (file: Path) =>
  isSourceFile(file) || isDeclarationFile(file)

export const fileMayBeEntry = (file: AbsolutePath): boolean =>
  isSourceFile(file) && fileExists(file)

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
  filename.replace(SOURCE_EXTENSION, TARGET_EXTENSION)

export const getOutPath = <T extends Path>(path: T): T => ({
  ...path,
  path: getOutFilename(path.path),
})

export const isSamePath = (path1: AbsolutePath, path2: AbsolutePath): boolean =>
  path1.path === path2.path
