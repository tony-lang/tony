import { Config } from '../config'
import { log } from '../logger'
import { FileScope } from '../types/analyze/scopes'
import { CyclicDependency } from '../types/cyclic_dependencies'
import {
  buildCyclicDependencyError,
  CyclicDependencyError,
} from '../types/errors/annotations'
import { AbsolutePath } from '../types/paths'
import { isSamePath } from '../util/file_system'
import { TopologicalSortError, topologicalSort } from '../util/topological_sort'

export const sortFileScopes = (
  config: Config,
  fileScopes: FileScope[],
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
