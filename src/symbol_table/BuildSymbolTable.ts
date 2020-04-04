import { GlobalScope } from './models/GlobalScope'
import { GraphSearch } from '../services/GraphSearch'
import { BuildFileModuleScope } from './BuildFileModuleScope'
import { FILE_EXTENSION_REGEX, IMPORT_FILE_EXTENSIONS } from '../constants'
import {
  TopologicalSort,
  TopologicalSortError,
} from '../services/TopologicalSort'
import { CyclicDependenciesError } from '../errors/CyclicDependenciesError'
import { FileModuleScope } from './models/FileModuleScope'
import { UnknownImportError } from '../errors/UnknownImportError'

export class BuildSymbolTable extends GraphSearch<string, GlobalScope> {
  private _fileScopes: FileModuleScope[] = []
  private _scope: GlobalScope
  private _verbose: boolean

  constructor(entryPath: string, verbose: boolean) {
    super(entryPath)

    if (verbose) console.log('Building symbol table...')

    if (!IMPORT_FILE_EXTENSIONS.find((regex) => regex.test(entryPath)))
      throw new UnknownImportError(entryPath)

    this._scope = new GlobalScope()
    this._verbose = verbose
  }

  protected success = (): GlobalScope => {
    const dependencyGraph = this.buildDependencyGraph()

    try {
      this._scope.scopes = new TopologicalSort(dependencyGraph)
        .perform()
        .map((i) => this._fileScopes[i])

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
      fileScope.dependencies.map((filePath) =>
        this._fileScopes.findIndex(
          (fileScope) => fileScope.filePath === filePath,
        ),
      ),
    )
}
