import { Config } from '../config'
import { log } from '../logger'
import { CyclicDependency, Path } from '../types'
import { FileScope } from '../types/analyze/scopes'
import {
  buildCyclicDependencyError,
  CyclicDependencyError,
} from '../types/errors/annotations'
import { TopologicalSortError, topologicalSort } from '../util/topological_sort'

export const sortFileScopes = (
  fileScopes: FileScope[],
  config: Config,
): {
  fileScopes: FileScope[]
  error?: CyclicDependencyError
} => {
  const dependencyGraph = buildDependencyGraph(fileScopes)

  log(config, 'Built dependency graph:', dependencyGraph)

  try {
    return {
      fileScopes: topologicalSort(dependencyGraph).map(
        getFileScope(fileScopes),
      ),
    }
  } catch (error: unknown) {
    if (error instanceof TopologicalSortError)
      return {
        fileScopes,
        error: buildCyclicDependencyError(
          buildCyclicDependency(fileScopes, error.cyclicDependency),
        ),
      }
    else throw error
  }
}

const buildDependencyGraph = (fileScopes: FileScope[]): number[][] =>
  fileScopes.map((fileScope) =>
    fileScope.dependencies
      .map((filePath) =>
        fileScopes.findIndex((fileScope) => fileScope.filePath === filePath),
      )
      .filter((i) => i != -1),
  )

const getFileScope = (fileScopes: FileScope[]) => (i: number) => fileScopes[i]

const buildCyclicDependency = (
  fileScopes: FileScope[],
  cyclicDependency: CyclicDependency<number>,
): CyclicDependency<Path> => {
  const a = getFileScope(fileScopes)(cyclicDependency.a).filePath
  const b = getFileScope(fileScopes)(cyclicDependency.b).filePath
  const ancestorsOfA = cyclicDependency.ancestorsOfA
    .map(getFileScope(fileScopes))
    .map((fileScope) => fileScope.filePath)

  return { a, b, ancestorsOfA }
}
