import childProcess from 'child_process'
import path from 'path'
import rimraf from 'rimraf'
import Parser from 'tree-sitter'

import Tony from './Tony'
import parser from './parser'
import GenerateCode from './GenerateCode'
import {
  readFile,
  writeFile,
  getProjectFileName,
  getOutputPathForFile,
  copyFile
} from './utilities'
import { FILE_EXTENSION } from './constants'

export async function compile(
  tony: Tony,
  project: string,
  mode: string,
  outFile: string,
  outDir: string,
  retainOutDir: boolean
): Promise<string> {
  if (tony.debug) console.log('Compiling...')

  const entryFilePath = path.join(process.cwd(), getProjectFileName(project))
  const files = [entryFilePath]
  const compiledFiles: string[] = []
  const outputDirPath = path.join(process.cwd(), outDir)
  const outputFilePath = path.join(process.cwd(), outFile)
  const codeGenerator = new GenerateCode(outputDirPath, files)

  while (files.length > 0) {
    const file = files.pop()
    if (compiledFiles.includes(file)) continue

    await compileFile(tony, codeGenerator, file, outputDirPath)
    compiledFiles.push(file)
  }

  babelCompile(tony, outputFilePath, outputDirPath, entryFilePath, mode)
  if (!retainOutDir) await cleanup(tony, outputDirPath)
  return outputFilePath
}

const compileFile = (
  tony: Tony,
  codeGenerator: GenerateCode,
  file: string,
  outputDirPath: string
): Promise<void> => {
  if (!file.endsWith(FILE_EXTENSION))
    return copyFile(file, getOutputPathForFile(outputDirPath, file))

  return readFile(file).then((sourceCode: string) => {
    if (tony.debug) console.log(`Parsing ${file}...`)
    const tree = parser.parse(sourceCode.toString())
    if (tree.rootNode.hasError()) {
      console.log(`Error while parsing ${file}...`)
      console.log(tree.rootNode.toString())
      process.exit(1)
    }
    if (tony.debug) console.log(tree.rootNode.toString())

    return tree.rootNode
  }).then((node: Parser.SyntaxNode) => {
    if (tony.debug) console.log(`Compiling ${file}...`)
    codeGenerator.file = file
    return writeFile(
      getOutputPathForFile(outputDirPath, file),
      codeGenerator.generate(node)
    )
  })
}

const babelCompile = (
  tony: Tony,
  outputFilePath: string,
  outputDirPath: string,
  entryFilePath: string,
  mode: string
): void => {
  if (tony.debug) console.log('Compiling with Webpack...')

  const p = childProcess.spawnSync(
    'yarn',
    [
      'webpack-cli',
      getOutputPathForFile(outputDirPath, entryFilePath),
      '-o', outputFilePath,
      '--mode', mode
    ],
    { stdio: tony.debug ? 'inherit' : null }
  )

  if (p.status != 0) process.exit(p.status)
}

const cleanup = (
  tony: Tony,
  outputDirPath: string
): Promise<void> => {
  if (tony.debug) console.log('Cleaning up temporary files...')

  return new Promise(resolve => rimraf(outputDirPath, () => resolve()))
}
