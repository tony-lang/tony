import { ProgramNode } from 'tree-sitter-tony'
import { Config } from '../config'
import { log } from '../logger'
import { parse } from '../parse'
import { Path } from '../types'
import { FileScope, buildFileScope } from '../types/analyze/scopes'
import { graphSearch } from '../util/graph_search'
import { constructAST } from './ast'
import { constructSymbolTable } from './symbol_table'

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
  log(`Building file scope of ${filePath}...`, config)

  const tree = await parse(filePath, config)
  const symbolTable = constructSymbolTable(
    filePath,
    tree.rootNode as ProgramNode,
  )
  const node = constructAST(symbolTable, tree.rootNode as ProgramNode)

  return buildFileScope(
    filePath,
    node,
    symbolTable.scopes,
    symbolTable.dependencies,
    symbolTable.bindings,
  )
}
