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
  { outFile, noEmit = false, webpackMode = 'production', verbose = false }: {
    outFile?: string;
    noEmit?: boolean;
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

    const [tree, symbolTable] = await analyzeFile(files, file, verbose)
    if (!noEmit) await compileFile(file, tree, symbolTable, verbose)
    compiledFiles.push(file)
  }

  if (noEmit) return

  await webpackCompile(outFilePath, webpackMode, verbose)
  return outFilePath
}

const analyzeFile = (
  files: string[],
  filePath: string,
  verbose: boolean
): Promise<[Parser.Tree, SymbolTable]> => parse(filePath, { verbose })
  .then(tree => analyze(files, filePath, tree, verbose))

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

const compileFile = (
  filePath: string,
  tree: Parser.Tree,
  symbolTable: SymbolTable,
  verbose: boolean
): Promise<void> => {
  const source = generateCode(filePath, tree, symbolTable, verbose)

  return writeFile(getOutFile(filePath), source)
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
