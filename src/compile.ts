import childProcess from 'child_process'
import path from 'path'
import Parser from 'tree-sitter'

import { Analyze, SymbolTable } from './analyzing'
import { GenerateCode } from './code_generation'
import { FILE_EXTENSION } from './constants'
import { parse } from './parse'
import {
  assert,
  getFilePath,
  getOutFile,
  writeFile
} from './utilities'

export const compile = async (
  file: string,
  { outFile, webpackMode = 'production', verbose = false }: {
    outFile?: string;
    webpackMode?: string;
    verbose?: boolean;
  }
): Promise<string> => {
  const filePath = getFilePath(file)
  const outFilePath = getFilePath(outFile || getOutFile(file))
  if (verbose) console.log(`Compiling ${filePath} to ${outFilePath}...`)

  const files = [filePath]
  const compiledFiles: string[] = []

  while (files.length > 0) {
    const file = files.pop()
    if (compiledFiles.includes(file) || !file.includes(FILE_EXTENSION)) continue

    await compileFile(files, file, verbose).catch(error => { throw error })
    compiledFiles.push(file)
  }

  await webpackCompile(outFilePath, webpackMode, verbose)
    .catch(error => { throw error })
  return outFilePath
}

const compileFile = (
  files: string[],
  filePath: string,
  verbose: boolean
): Promise<void> => parse(filePath, { verbose })
  .then(tree => analyze(files, filePath, tree, verbose))
  .then(([tree, symbolTable]) =>
    generateCode(filePath, tree, symbolTable, verbose)
  )
  .then(source => writeFile(getOutFile(filePath), source))

const analyze = (
  files: string[],
  filePath: string,
  tree: Parser.Tree,
  verbose: boolean
): [Parser.Tree, SymbolTable] => {
  if (verbose) console.log(`Analyzing ${filePath}...`)

  const symbolTable = new Analyze(filePath).perform(tree.rootNode)
  files.push(...symbolTable.importedFiles)

  return [tree, symbolTable]
}

const generateCode = (
  filePath: string,
  tree: Parser.Tree,
  symbolTable: SymbolTable,
  verbose: boolean
): string => {
  if (verbose) console.log(`Generating code for ${filePath}...`)

  return new GenerateCode(symbolTable).generate(tree.rootNode)
}

const webpackCompile = (
  filePath: string,
  mode: string,
  verbose: boolean
): Promise<void> => {
  if (verbose) console.log('Compiling with Webpack...')

  return new Promise(resolve => {
    childProcess
      .spawn(
        path.join(__dirname, '..', '..', 'node_modules', '.bin', 'webpack-cli'),
        [filePath, '-o', filePath, '--mode', mode],
        { stdio: verbose ? 'inherit' : null }
      )
      .on('close', resolve)
      .on('error', (error) => {
        assert(
          false,
          `${error.name}: ${error.message}\n\n` +
          `Oh noes! Tony wasn't able to compile ${filePath}.\nPlease report ` +
          'the file you tried to compile as well as the printed output at ' +
          'https://github.com/tony-lang/tony/issues'
        )
      })
  })
}
