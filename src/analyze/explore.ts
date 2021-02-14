import {
  DeclarationDependency,
  Dependency,
  DependencyKind,
  SourceDependency,
  buildSourceDependency,
} from '../types/analyze/dependencies'
import { LogLevel, log } from '../logger'
import { parseDeclaration, parseSource } from '../parse'
import { Config } from '../config'
import { SyntaxType as DeclarationSyntaxType } from 'tree-sitter-tony/dtn'
import { FileScope } from '../types/analyze/scopes'
import { SyntaxType as SourceSyntaxType } from 'tree-sitter-tony/tony'
import { assert } from '../types/errors/internal'
import { constructFileScopeFromDeclaration } from './analyze_declaration'
import { constructFileScopeFromSource } from './analyze_source'
import { graphSearch } from '../util/graph_search'

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

const analyzeDeclaration = async (
  config: Config,
  dependency: DeclarationDependency,
): Promise<FileScope> => {
  log(config, LogLevel.Info, 'Building file scope of', dependency.file)

  const tree = await parseDeclaration(config, dependency)
  assert(
    tree.rootNode.type === DeclarationSyntaxType.Program,
    'The root node should be a program node.',
  )
  return constructFileScopeFromDeclaration(config, dependency, tree.rootNode)
}

const analyzeSource = async (
  config: Config,
  dependency: SourceDependency,
): Promise<FileScope> => {
  log(config, LogLevel.Info, 'Building file scope of', dependency.file)

  const tree = await parseSource(config, dependency)
  assert(
    tree.rootNode.type === SourceSyntaxType.Program,
    'The root node should be a program node.',
  )
  return constructFileScopeFromSource(config, dependency, tree.rootNode)
}
