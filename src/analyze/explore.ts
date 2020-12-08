import { Path } from '../types'
import { FileScope } from '../types/analyze/scopes'
import { graphSearch } from '../util/graph_search'

export const analyzeFiles = (entry: Path) =>
  graphSearch<Path, FileScope[]>(
    async (fileScopes, filePath, exploredFilePaths) => {
      const fileScope: FileScope = await analyzeFile(filePath)
      const newFileScopes = [...fileScopes, fileScope]
      const newVertices = fileScope.dependencies.filter(
        (filePath) => !exploredFilePaths.includes(filePath),
      )

      return [newFileScopes, newVertices]
    },
    [],
    [entry],
  )

const analyzeFile = async (filePath: Path): Promise<FileScope> => {}
