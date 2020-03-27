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
  copyFile
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
  const codeGenerator = new GenerateCode(outputDirPath, files)

  while (files.length > 0) {
    const file = files.pop()
    if (compiledFiles.includes(file)) continue

    await compileFile(tony, codeGenerator, file, outputDirPath)
    compiledFiles.push(file)
  }

  // webpackCompile(tony, outputFilePath, outputDirPath, entryFilePath, mode)
  // if (!retainOutDir) await cleanup(tony, outputDirPath)
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
    if (tony.debug) console.log(`Analyzing ${file}...`)
    const analyzer = new Analyze(file, outputDirPath)
    const symbolTable = analyzer.perform(node)
    console.dir(symbolTable, { depth: null })
    process.exit(0)

    // if (tony.debug) console.log(`Compiling ${file}...`)
    // codeGenerator.getImportSource.file = file
    // return writeFile(
    //   getOutputPathForFile(outputDirPath, file),
    //   codeGenerator.generate(node)
    // )
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

  if (p.status != 0) {
    console.log(p.stdout.toString())
    console.log(
      `Oh noes! Tony wasn't able to compile ${entryFilePath}.\nPlease report ` +
      'the file you tried to compile as well as the printed output at ' +
      'https://github.com/tony-lang/tony/issues'
    )
    process.exit(p.status)
  }
}

const cleanup = (
  tony: Tony,
  outputDirPath: string
): Promise<void> => {
  if (tony.debug) console.log('Cleaning up temporary files...')

  return new Promise(resolve => rimraf(outputDirPath, () => resolve()))
}
