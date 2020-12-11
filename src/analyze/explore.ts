import { ProgramNode } from 'tree-sitter-tony'
import { Config } from '../config'
import { log } from '../logger'
import { parse } from '../parse'
import { Path } from '../types'
import { FileScope } from '../types/analyze/scopes'
import { graphSearch } from '../util/graph_search'
import { constructFileScope } from './file_scope'

export const analyzeFiles = (entry: Path, config: Config) =>
  graphSearch<Path, FileScope[]>(
    async (fileScopes, filePath, exploredFilePaths) => {
      const fileScope = await analyzeFile(filePath, config)
      const newFileScopes = [...fileScopes, fileScope]
      const newVertices = fileScope.dependencies.filter(
        (filePath) => !exploredFilePaths.includes(filePath),
      )

      return [newFileScopes, newVertices]
    },
    [],
    [entry],
  )

const analyzeFile = async (
  filePath: Path,
  config: Config,
): Promise<FileScope> => {
  log(config, 'Building file scope of', filePath)

  const tree = await parse(filePath, config)
  return constructFileScope(
    filePath,
    tree.rootNode as ProgramNode,
  )
}
