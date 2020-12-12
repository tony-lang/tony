import { ProgramNode } from 'tree-sitter-tony'
import { Config } from '../config'
import { log } from '../logger'
import { parse } from '../parse'
import { FileScope } from '../types/analyze/scopes'
import { AbsolutePath } from '../types/paths'
import { graphSearch } from '../util/graph_search'
import { constructFileScope } from './file_scope'

export const analyzeFiles = (config: Config) =>
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
  log(config, 'Building file scope of', file)

  const tree = await parse(config, file)
  return constructFileScope(config, file, tree.rootNode as ProgramNode)
}
