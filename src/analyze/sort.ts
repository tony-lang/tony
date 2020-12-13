import {
  CyclicDependencyError,
  buildCyclicDependencyError,
} from '../types/errors/annotations'
import { TopologicalSortError, topologicalSort } from '../util/topological_sort'
import { AbsolutePath } from '../types/paths'
import { Config } from '../config'
import { CyclicDependency } from '../types/cyclic_dependencies'
import { FileScope } from '../types/analyze/scopes'
import { isSamePath } from '../util/paths'
import { LogLevel, log } from '../logger'

export const sortFileScopes = (
  config: Config,
  fileScopes: FileScope[],
): {
  fileScopes: FileScope[]
  error?: CyclicDependencyError
} => {
  const dependencyGraph = buildDependencyGraph(fileScopes)

  log(config, LogLevel.Debug, 'Built dependency graph:', dependencyGraph)

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
      .map((file) =>
        fileScopes.findIndex((fileScope) => isSamePath(fileScope.file, file)),
      )
      .filter((i) => i != -1),
  )

const getFileScope = (fileScopes: FileScope[]) => (i: number) => fileScopes[i]

const buildCyclicDependency = (
  fileScopes: FileScope[],
  cyclicDependency: CyclicDependency<number>,
): CyclicDependency<AbsolutePath> => {
  const a = getFileScope(fileScopes)(cyclicDependency.a).file
  const b = getFileScope(fileScopes)(cyclicDependency.b).file
  const ancestorsOfA = cyclicDependency.ancestorsOfA
    .map(getFileScope(fileScopes))
    .map((fileScope) => fileScope.file)

  return { a, b, ancestorsOfA }
}
