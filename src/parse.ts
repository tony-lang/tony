import { LogLevel, log } from './logger'
import TreeSitterTony, { Tree } from 'tree-sitter-tony/tony'
import { AbsolutePath } from './types/path'
import { Config } from './config'
import Parser from 'tree-sitter'
import { readFile } from './util/paths'

const parser = new Parser()
parser.setLanguage(TreeSitterTony)

export const parse = async (
  config: Config,
  file: AbsolutePath,
): Promise<Tree> => {
  log(config, LogLevel.Info, 'Parsing', file.path)

  const sourceCode = await readFile(file)
  return parser.parse(sourceCode) as Tree
}
