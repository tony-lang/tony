import { getFilePath, readFile } from './util'
import Parser from 'tree-sitter'
import TreeSitterTony, { Tree } from 'tree-sitter-tony'
import { Config } from './config'
import { log } from './logger'

const parser = new Parser()
parser.setLanguage(TreeSitterTony)

export const parse = async (file: string, config: Config): Promise<Tree> => {
  const filePath = getFilePath(file)

  log(`Parsing ${filePath}...`, config)

  const sourceCode = await readFile(filePath)
  return parser.parse(sourceCode) as Tree
}
