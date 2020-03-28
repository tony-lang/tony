import childProcess from 'child_process'
import path from 'path'
import rimraf from 'rimraf'
import Parser from 'tree-sitter'

import Tony from './Tony'
import parser from './parser'
import { Analyze } from './analyzing'
import { GenerateCode } from './code_generation'
import {
  readFile,
  writeFile,
  getEntryFilePath,
  getOutputPathForFile,
  copyFile,
  assert
} from './utilities'
import { FILE_EXTENSION } from './constants'

export const compile = async (
  tony: Tony,
  project: string,
  mode: string,
  outFile: string,
  outDir: string,
  retainOutDir: boolean
): Promise<string> => {
  if (tony.debug) console.log('Compiling...')

  const entryFilePath = getEntryFilePath(project)
  const files = [entryFilePath]
  const compiledFiles: string[] = []
  const outputDirPath = path.join(process.cwd(), outDir)
  const outputFilePath = path.join(process.cwd(), outFile)

  while (files.length > 0) {
    const file = files.pop()
    if (compiledFiles.includes(file)) continue

    await compileFile(tony, files, file, outputDirPath)
    compiledFiles.push(file)
  }

  webpackCompile(tony, outputFilePath, outputDirPath, entryFilePath, mode)
  if (!retainOutDir) await cleanup(tony, outputDirPath)
  return outputFilePath
}

const compileFile = (
  tony: Tony,
  files: string[],
  file: string,
  outputDirPath: string
): Promise<void> => {
  if (!file.endsWith(FILE_EXTENSION))
    return copyFile(file, getOutputPathForFile(outputDirPath, file))

  return readFile(file).then((sourceCode: string) => {
    if (tony.debug) console.log(`Parsing ${file}...`)
    const tree = parser.parse(sourceCode.toString())
    assert(
      !tree.rootNode.hasError(),
      `Error while parsing ${file}...\n${tree.rootNode.toString()}`
    )
    if (tony.debug) console.log(tree.rootNode.toString())

    return tree.rootNode
  }).then((node: Parser.SyntaxNode) => {
    if (tony.debug) console.log(`Analyzing ${file}...`)
    const analyzer = new Analyze(file, outputDirPath)
    const symbolTable = analyzer.perform(node)
    files.push(...symbolTable.importedFiles)
    if (tony.debug) console.dir(symbolTable, { depth: null })

    if (tony.debug) console.log(`Compiling ${file}...`)
    const codeGenerator = new GenerateCode(symbolTable)
    return writeFile(
      getOutputPathForFile(outputDirPath, file),
      codeGenerator.generate(node)
    )
  })
}

const webpackCompile = (
  tony: Tony,
  outputFilePath: string,
  outputDirPath: string,
  entryFilePath: string,
  mode: string
): void => {
  if (tony.debug) console.log('Compiling with Webpack...')

  const p = childProcess.spawnSync(
    path.join(__dirname, '..', 'node_modules', '.bin', 'webpack-cli'),
    [
      getOutputPathForFile(outputDirPath, entryFilePath),
      '-o', outputFilePath,
      '--mode', mode
    ],
    { stdio: tony.debug ? 'inherit' : null }
  )

  assert(
    p.status == 0,
    () => `${p.stdout.toString()}\n\n` +
    `Oh noes! Tony wasn't able to compile ${entryFilePath}.\nPlease report ` +
    'the file you tried to compile as well as the printed output at ' +
    'https://github.com/tony-lang/tony/issues'
  )
}

const cleanup = (
  tony: Tony,
  outputDirPath: string
): Promise<void> => {
  if (tony.debug) console.log('Cleaning up temporary files...')

  return new Promise(resolve => rimraf(outputDirPath, () => resolve()))
}
