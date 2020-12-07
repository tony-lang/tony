import { FILE_EXTENSION, TARGET_FILE_EXTENSION } from './constants'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'

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

export const getFilePath = (file: string) => {
  if (!file.startsWith('.')) return file

  return path.join(process.cwd(), file)
}

export const getOutFile = (file: string) =>
  file.replace(FILE_EXTENSION, TARGET_FILE_EXTENSION)

export const isNotUndefined = <T>(value: T | undefined): value is T =>
  value !== undefined
