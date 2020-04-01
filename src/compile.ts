import Parser from 'tree-sitter'

import { Analyze, SymbolTable } from './analyzing'
import { GenerateCode } from './code_generation'
import { FILE_EXTENSION } from './constants'
import { parse } from './parse'
import {
  getFilePath,
  getOutFile,
  writeFile
} from './utilities'
import { compile as webpackCompile } from './webpack'

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

    await compileFile(files, file, verbose)
    compiledFiles.push(file)
  }

  await webpackCompile(outFilePath, webpackMode, verbose)
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
