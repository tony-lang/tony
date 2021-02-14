import {
  FileScope,
  GlobalScope,
  buildGlobalScope,
} from '../types/analyze/scopes'
import { LogLevel, log } from '../logger'
import { TopologicalSortError, topologicalSort } from '../util/topological_sort'
import { Config } from '../config'
import { CyclicDependency } from '../types/cyclic_dependency'
import { Dependency } from '../types/analyze/dependencies'
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
      (i) => fileScopes[i],
    )
    log(
      config,
      LogLevel.Debug,
      'Topological sorting on files returned:',
      sortedFileScopes
        .map((fileScope) => fileScope.dependency.file.path)
        .join('>'),
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
      .map((dependency) =>
        fileScopes.findIndex((fileScope) =>
          isSamePath(fileScope.dependency.file, dependency.file),
        ),
      )
      .filter((i) => i != -1),
  )

const buildCyclicDependency = (
  fileScopes: FileScope[],
  cyclicDependency: CyclicDependency<number>,
): CyclicDependency<Dependency> => {
  const a = fileScopes[cyclicDependency.a].dependency
  const b = fileScopes[cyclicDependency.b].dependency
  const ancestorsOfA = cyclicDependency.ancestorsOfA
    .map((i) => fileScopes[i])
    .map((fileScope) => fileScope.dependency)

  return { a, b, ancestorsOfA }
}
