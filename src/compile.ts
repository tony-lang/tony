import { BuildSymbolTable, FileModuleScope } from './symbol_table'
import { getFilePath, getOutFile, writeFile } from './utilities'
import { GenerateCode } from './code_generation'
import { InferTypes } from './type_inference'
import Parser from 'tree-sitter'
import { compile as webpackCompile } from './webpack'

// eslint-disable-next-line max-lines-per-function
export const compile = async (
  file: string,
  {
    outFile,
    emit = true,
    webpack = true,
    webpackMode = 'production',
    verbose = false,
  }: {
    outFile?: string
    emit?: boolean
    webpack?: boolean
    webpackMode?: string
    verbose?: boolean
  },
): Promise<string | undefined> => {
  const filePath = getFilePath(file)
  const outFilePath = getFilePath(outFile || getOutFile(file))
  if (verbose) console.log(`Compiling ${filePath} to ${outFilePath}...`)

  const globalScope = await new BuildSymbolTable(filePath, verbose).perform()
  const bindingTransformedNames = inferTypes(globalScope.scopes, verbose)

  if (!emit) return

  await generateCode(globalScope.scopes, bindingTransformedNames, verbose)
  if (webpack) await webpackCompile(outFilePath, webpackMode, verbose)

  return outFilePath
}

const inferTypes = (fileScopes: FileModuleScope[], verbose: boolean): Map<Parser.SyntaxNode, string>[] =>
  fileScopes.map((fileScope) => {
    if (verbose)
      console.log(`Running type inference on ${fileScope.filePath}...`)

    return new InferTypes(fileScope).perform()
  })

const generateCode = async (
  fileScopes: FileModuleScope[],
  bindingTransformedNames: Map<Parser.SyntaxNode, string>[],
  verbose: boolean,
): Promise<void> => {
  await Promise.all(
    fileScopes.map(async (fileScope, i) => {
      if (verbose) console.log(`Generating code for ${fileScope.filePath}...`)

      const source = new GenerateCode(fileScope, bindingTransformedNames[i]).perform()
      await writeFile(getOutFile(fileScope.filePath), source)
    }),
  )
}
