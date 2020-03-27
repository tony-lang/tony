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

export const copyFile = (
  sourcePath: string,
  targetPath: string
): Promise<void> => {
  return readFile(sourcePath).then(data => writeFile(targetPath, data))
}

export const getWorkingDirectoryName = (): string => {
  return path.basename(process.cwd())
}

const getProjectFileName = (project: string): string => {
  if (project.endsWith(FILE_EXTENSION))
    return project
  else
    return `${project}${FILE_EXTENSION}`
}

export const getProjectName = (project: string): string => {
  if (project.endsWith(FILE_EXTENSION))
    return project.replace(FILE_EXTENSION, '')
  else
    return project
}

export const getOutputFileName = (project: string): string => {
  return `${getProjectName(project)}${TARGET_FILE_EXTENSION}`
}

export const getOutputPathForFile = (
  outputPath: string,
  file: string
): string => {
  const filePath = file
    .replace(process.cwd(), '')
    .replace(__dirname, '')
    .replace(FILE_EXTENSION, TARGET_FILE_EXTENSION)

  return path.join(outputPath, filePath)
}

export const getEntryFilePath = (project: string): string => {
  const file = getProjectFileName(project)
  if (fs.existsSync(file)) return file

  return path.join(process.cwd(), file)
}

export function assert(value: any, message: string): asserts value {
  if (value) return

  console.error(message)
}
