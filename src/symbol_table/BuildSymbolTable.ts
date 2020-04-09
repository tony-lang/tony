import {
  TopologicalSort,
  TopologicalSortError,
} from '../services/TopologicalSort'
import { BuildFileModuleScope } from './BuildFileModuleScope'
import { CyclicDependenciesError } from '../errors/CyclicDependenciesError'
import { FILE_EXTENSION_REGEX } from '../constants'
import { FileModuleScope } from './models/FileModuleScope'
import { GlobalScope } from './models/GlobalScope'
import { GraphSearch } from '../services/GraphSearch'
import { UnknownImportError } from '../errors/UnknownImportError'
import path from 'path'

export class BuildSymbolTable extends GraphSearch<string, GlobalScope> {
  private _fileScopes: FileModuleScope[] = []
  private _scope: GlobalScope
  private _verbose: boolean

  constructor(entryPath: string, verbose: boolean) {
    super(path.resolve(entryPath))

    if (verbose) console.log('Building symbol table...')

    if (!FILE_EXTENSION_REGEX.test(entryPath))
      throw new UnknownImportError(entryPath)

    this._scope = new GlobalScope()
    this._verbose = verbose
  }

  protected success = (): GlobalScope => {
    const dependencyGraph = this.buildDependencyGraph()
    if (this._verbose) console.log('Built dependency graph', dependencyGraph)

    try {
      const topologicalSort = new TopologicalSort(dependencyGraph).perform()
      if (this._verbose)
        console.log('Topological sort of dependency graph', topologicalSort)

      this._scope.scopes = topologicalSort.map((i) => this._fileScopes[i])
      return this._scope
    } catch (error) {
      if (error instanceof TopologicalSortError)
        throw new CyclicDependenciesError([
          this._fileScopes[error.cyclicDependency[0]].filePath,
          this._fileScopes[error.cyclicDependency[1]].filePath,
        ])
      else throw error
    }
  }

  protected visit = async (filePath: string): Promise<string[]> => {
    if (!FILE_EXTENSION_REGEX.test(filePath)) return []

    const fileScope = await new BuildFileModuleScope(
      this._scope,
      filePath,
      this._verbose,
    ).perform()
    this._fileScopes = [...this._fileScopes, fileScope]

    return fileScope.dependencies.filter(
      (sourcePath) => !this.isExplored(sourcePath),
    )
  }

  // builds an adjacency list where numbers represent indices in fileScopes
  private buildDependencyGraph = (): number[][] =>
    this._fileScopes.map((fileScope) =>
      fileScope.dependencies
        .map((filePath) =>
          this._fileScopes.findIndex(
            (fileScope) => fileScope.filePath === filePath,
          ),
        )
        .filter((i) => i != -1),
    )
}
