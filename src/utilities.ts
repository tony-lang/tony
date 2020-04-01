import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'

import { FILE_EXTENSION, TARGET_FILE_EXTENSION } from './constants'

export const readFile = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (error, data) => {
      !error ? resolve(data) : reject(error)
    })
  })
}

export const writeFile = (filePath: string, data = ''): Promise<void> => {
  return mkdirp(path.dirname(filePath)).then(() => {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, data, error => {
        !error ? resolve() : reject(error)
      })
    })
  })
}

export const getFilePath = (file: string): string => {
  if (!file.startsWith('.')) return file

  return path.join(process.cwd(), file)
}

export const getOutFile = (file: string): string =>
  file.replace(FILE_EXTENSION, TARGET_FILE_EXTENSION)
