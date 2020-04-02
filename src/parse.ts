import { getFilePath, readFile } from './utilities'
import Parser from 'tree-sitter'
import { SyntaxError } from './errors'
import TreeSitterTony from 'tree-sitter-tony'

const parser = new Parser()
parser.setLanguage(TreeSitterTony)

export const parse = async (
  file: string,
  { verbose = false },
): Promise<Parser.Tree> => {
  const filePath = getFilePath(file)
  if (verbose) console.log(`Parsing ${filePath}...`)

  const sourceCode = await readFile(filePath)
  const tree = parser.parse(sourceCode)

  if (tree.rootNode.hasError()) throw new SyntaxError(filePath, tree)

  return tree
}
