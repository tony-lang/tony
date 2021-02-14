import { LogLevel, log } from '../logger'
import { Config } from '../config'
import { FileScope } from '../types/analyze/scopes'
import { SyntaxType } from 'tree-sitter-tony/tony'
import { assert } from '../types/errors/internal'
import { constructFileScope } from './file_scope'
import { graphSearch } from '../util/graph_search'
import { parse } from '../parse'
import {
  buildSourceDependency,
  Dependency,
  DependencyKind,
  SourceDependency,
} from '../types/analyze/dependencies'

export const analyzeFiles = (config: Config): Promise<FileScope[]> =>
  graphSearch<Dependency, FileScope[]>(
    async (fileScopes, dependency, exploredDependencies) => {
      const fileScope = await analyzeDependency(config, dependency)
      const newFileScopes = [...fileScopes, fileScope]
      const newVertices = fileScope.dependencies.filter(
        (dependency) => !exploredDependencies.includes(dependency),
      )

      return [newFileScopes, newVertices]
    },
    [],
    [buildSourceDependency(config.entry)],
  )

const analyzeDependency = (
  config: Config,
  dependency: Dependency,
): Promise<FileScope> => {
  switch (dependency.kind) {
    case DependencyKind.Declaration:
      return analyzeDeclaration(config, dependency)
    case DependencyKind.Source:
      return analyzeSource(config, dependency)
  }
}

const analyzeSource = async (
  config: Config,
  { file }: SourceDependency,
): Promise<FileScope> => {
  log(config, LogLevel.Info, 'Building file scope of', file)

  const tree = await parse(config, file)
  assert(
    tree.rootNode.type === SyntaxType.Program,
    'The root node should be a program node.',
  )
  return constructFileScope(config, file, tree.rootNode)
}
