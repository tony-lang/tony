import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'

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

export const getProjectFileName = (project: string): string => {
  return project.endsWith('.tn') ? project : `${project}.tn`
}

export const getProjectName = (project: string): string => {
  return project.endsWith('.tn') ? project.replace('.tn', '') : project
}

export const getOutputFileName = (project: string): string => {
  return `${getProjectName(project)}.js`
}

export const getOutputPathForFile = (
  outputPath: string,
  file: string
): string => {
  const filePath =
    file.replace(process.cwd(), '').replace(__dirname, '').replace('.tn', '.js')

  return `${outputPath}${filePath}`
}

export const getRelativePathToOutDir = (
  outputPath: string,
  fileOutputPath: string
): string => {
  const dirDepth = fileOutputPath.replace(outputPath, '').split('/').length - 2

  return '.' + '/..'.repeat(dirDepth)
}

export const getRelativeOutputPathForFile = (
  outputPath: string,
  fileOutputPath: string
): string => {
  const filePath = fileOutputPath.replace(outputPath, '')

  return getRelativePathToOutDir(outputPath, fileOutputPath) + filePath
}

export const range = (start: number, end: number): number[] => {
  if (end < start) return []

  return Array.from({length: (end + 1 - start)}, (v, k) => k + start)
}
