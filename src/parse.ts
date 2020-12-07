import { getFilePath, readFile } from './util'
import Parser from 'tree-sitter'
import { SyntaxError } from './errors/SyntaxError'
import TreeSitterTony, { Tree } from 'tree-sitter-tony'

const parser = new Parser()
parser.setLanguage(TreeSitterTony)

export const parse = async (
  file: string,
  { verbose = false },
): Promise<Tree> => {
  const filePath = getFilePath(file)
  if (verbose) console.log(`Parsing ${filePath}...`)

  const sourceCode = await readFile(filePath)
  const tree = parser.parse(sourceCode) as Tree

  if (tree.rootNode.hasError()) throw new SyntaxError(filePath, tree)

  return tree
}
