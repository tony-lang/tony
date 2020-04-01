import Parser from 'tree-sitter'
import TreeSitterTony from 'tree-sitter-tony'

import { assert, getFilePath, readFile } from './utilities'

const parser = new Parser()
parser.setLanguage(TreeSitterTony)

export const parse = (
  file: string,
  { verbose = false }
): Promise<Parser.Tree> => {
  const filePath = getFilePath(file)
  if (verbose) console.log(`Parsing ${filePath}...`)

  return readFile(filePath)
    .then((sourceCode: string) => parser.parse(sourceCode))
    .then(tree => {
      assert(
        !tree.rootNode.hasError(),
        `Error while parsing ${file}...\n${tree.rootNode.toString()}`
      )

      return tree
    })
}
