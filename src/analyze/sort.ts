import {
  FileScope,
  GlobalScope,
  buildGlobalScope,
} from '../types/analyze/scopes'
import { LogLevel, log } from '../logger'
import { TopologicalSortError, topologicalSort } from '../util/topological_sort'
import { AbsolutePath } from '../types/path'
import { Config } from '../config'
import { CyclicDependency } from '../types/cyclic_dependency'
import { buildCyclicDependencyError } from '../types/errors/annotations'
import { isSamePath } from '../util/paths'

export const sortFileScopes = (
  config: Config,
  fileScopes: FileScope[],
): GlobalScope<FileScope> => {
  const dependencyGraph = buildDependencyGraph(fileScopes)

  log(config, LogLevel.Debug, 'Built dependency graph:', dependencyGraph)

  try {
    const sortedFileScopes = topologicalSort(dependencyGraph).map(
      getFileScope(fileScopes),
    )
    log(
      config,
      LogLevel.Debug,
      'Topological sorting on files returned:',
      sortedFileScopes.map((fileScope) => fileScope.file.path).join('>'),
    )
    return buildGlobalScope(sortedFileScopes)
  } catch (error: unknown) {
    if (error instanceof TopologicalSortError) {
      const cyclicDependency = buildCyclicDependency(
        fileScopes,
        error.cyclicDependency,
      )
      log(
        config,
        LogLevel.Debug,
        'Topological sorting failed with cyclic dependency:',
        cyclicDependency,
      )
      return buildGlobalScope(fileScopes, [
        buildCyclicDependencyError(cyclicDependency),
      ])
    } else throw error
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
