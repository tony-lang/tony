import childProcess from 'child_process'
import fs from 'fs'
import path from 'path'
import Parser from 'tree-sitter'

import Tony from './Tony'
import parser from './parser'
import GenerateCode from './GenerateCode'
import {
  readFile,
  writeFile,
  getProjectFileName,
  getOutputPathForFile
} from './utilities'

export const compile = (
  tony: Tony,
  project: string,
  outFile: string,
  outDir: string,
  retainOutDir: boolean
): Promise<string> => {
  if (tony.debug) console.log('Compiling...')

  const file = path.join(process.cwd(), getProjectFileName(project))
  const outputPath = path.join(process.cwd(), outDir)

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
    return writeFile(
      getOutputPathForFile(outputPath, file),
      new GenerateCode().generate(node)
    )
  }).then(() => {
    babelCompile(tony, outFile, outDir)
    if (!retainOutDir)
      cleanup(tony, outDir, [getOutputPathForFile(outputPath, file)])
    return outFile
  })
}

const babelCompile = (tony: Tony, outFile: string, outDir: string): void => {
  if (tony.debug) console.log('Compiling with Babel...')

  const p = childProcess.spawnSync(
    'yarn',
    ['babel', outDir, '-o', outFile],
    { stdio: tony.debug ? 'inherit' : null }
  )

  if (p.status != 0) process.exit(p.status)
}

const cleanup = (tony: Tony, outDir: string, files: string[]): void => {
  if (tony.debug) console.log('Cleaning up temporary files...')

  files.forEach(file => fs.unlinkSync(file))
  if (fs.readdirSync(outDir).length == 0) fs.rmdirSync(outDir)
}
