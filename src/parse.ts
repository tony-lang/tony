import TreeSitterTony, { Tree } from 'tree-sitter-tony'
import { AbsolutePath } from './types/paths'
import { Config } from './config'
import Parser from 'tree-sitter'
import { log } from './logger'
import { readFile } from './util/paths'

const parser = new Parser()
parser.setLanguage(TreeSitterTony)

export const parse = async (
  config: Config,
  file: AbsolutePath,
): Promise<Tree> => {
  log(config, 'Parsing', file.path)

  const sourceCode = await readFile(file)
  return parser.parse(sourceCode) as Tree
}
