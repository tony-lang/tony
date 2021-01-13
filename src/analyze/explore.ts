import { LogLevel, log } from '../logger'
import { AbsolutePath } from '../types/path'
import { Config } from '../config'
import { FileScope } from '../types/analyze/scopes'
import { SyntaxType } from 'tree-sitter-tony'
import { assert } from '../types/errors/internal'
import { constructFileScope } from './file_scope'
import { graphSearch } from '../util/graph_search'
import { parse } from '../parse'

export const analyzeFiles = (config: Config): Promise<FileScope[]> =>
  graphSearch<AbsolutePath, FileScope[]>(
    async (fileScopes, file, exploredFiles) => {
      const fileScope = await analyzeFile(config, file)
      const newFileScopes = [...fileScopes, fileScope]
      const newVertices = fileScope.dependencies.filter(
        (file) => !exploredFiles.includes(file),
      )

      return [newFileScopes, newVertices]
    },
    [],
    [config.entry],
  )

const analyzeFile = async (
  config: Config,
  file: AbsolutePath,
): Promise<FileScope> => {
  log(config, LogLevel.Info, 'Building file scope of', file)

  const tree = await parse(config, file)
  assert(
    tree.rootNode.type === SyntaxType.Program,
    'The root node should be a program node.',
  )
  return constructFileScope(config, file, tree.rootNode)
}
