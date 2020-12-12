import { readFile } from './util/file_system'
import Parser from 'tree-sitter'
import TreeSitterTony, { Tree } from 'tree-sitter-tony'
import { Config } from './config'
import { log } from './logger'
import { AbsolutePath } from './types/paths'

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
