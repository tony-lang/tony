import {
  Binding,
  FileModuleScope,
  GlobalScope,
  IdentifierBinding,
  ModuleScope,
  NestedScope,
  TypeBinding,
} from './models'
import {
  BuildImportBindings,
  BuildPatternBindings,
  UnifyPatternBindings,
} from './services'
import {
  BuildRepresentation,
  BuildType,
  LIST_TYPE,
  ParametricType,
  RepresentationKind,
  TypeVariable,
} from '../types'
import {
  CompileError,
  DuplicateBindingError,
  ExportOutsideModuleScopeError,
  ImportOutsideFileModuleScopeError,
  MissingBindingError,
  assert,
} from '../errors'
import { IMPORT_FILE_EXTENSIONS } from '../constants'
import Parser from 'tree-sitter'
import { UnknownImportError } from '../errors/UnknownImportError'
import { parse } from '../parse'
import path from 'path'

export class BuildFileModuleScope {
  private _fileScope: FileModuleScope
  private _filePath: string
  private _scope: NestedScope
  private _verbose: boolean

  // tracks if the next added bindings should be exported
  private _exportBindings = false
  // tracks if the next block belongs to a declaration
  private _isDeclaration = false

  constructor(globalScope: GlobalScope, filePath: string, verbose: boolean) {
    if (verbose) console.log(`Building file module scope of ${filePath}...`)

    this._filePath = filePath
    this._fileScope = this._scope = new FileModuleScope(globalScope, filePath)
    this._verbose = verbose
  }

  perform = async (): Promise<FileModuleScope> => {
    this._fileScope.tree = await parse(this._filePath, {
      verbose: this._verbose,
    })
    try {
      this.traverse(this._fileScope.tree.rootNode)
    } catch (error) {
      if (error instanceof CompileError) error.filePath = this._filePath
      throw error
    }

    return this._fileScope
  }

  // eslint-disable-next-line max-lines-per-function
  private traverse = (node: Parser.SyntaxNode): void => {
    try {
      switch (node.type) {
        case 'abstraction_branch':
          return this.handleAbstractionBranch(node)
        case 'assignment':
          return this.handleAssignment(node)
        case 'block':
          return this.handleBlock(node)
        case 'export':
          return this.handleExport(node)
        case 'generator':
          return this.handleGenerator(node)
        case 'identifier':
          return this.handleIdentifier(node)
        case 'import':
          return this.handleImport(node)
        case 'list_comprehension':
          return this.handleListComprehension(node)
        case 'module':
          return this.handleModule(node)
        case 'parameters':
          return this.handleParameters(node)
        case 'pattern_list':
          return this.handlePatternList(node)
        case 'when_clause':
          return this.handleWhenClause(node)
        default:
          node.namedChildren.forEach((child) => this.traverse(child))
      }
    } catch (error) {
      if (error instanceof CompileError && error.context === undefined)
        error.addContext(node)
      throw error
    }
  }

  private handleAbstractionBranch = (node: Parser.SyntaxNode): void => {
    this.enterBlock()

    this.traverse(node.namedChild(0)!)
    this.traverse(node.namedChild(1)!)

    this._scope.reduce()
    this.leaveBlock()
  }

  private handleAssignment = (node: Parser.SyntaxNode): void => {
    const isExported = this.disableExports()

    this.traverse(node.namedChild(0)!)
    new BuildPatternBindings({ isExported, isImplicit: false })
      .perform(node.namedChild(0)!)
      .forEach((binding) => this.addBinding(binding))

    this.traverse(node.namedChild(1)!)
  }

  private handleBlock = (node: Parser.SyntaxNode): void => {
    this.enterBlock()

    node.namedChildren.forEach((child) => this.traverse(child))

    this.leaveBlock()
  }

  private handleExport = (node: Parser.SyntaxNode): void => {
    if (!(this._scope instanceof ModuleScope))
      throw new ExportOutsideModuleScopeError()

    this.enableExports()
    this.traverse(node.namedChild(0)!)
  }

  private handleGenerator = (node: Parser.SyntaxNode): void => {
    this.traverse(node.namedChild(1)!)

    const name = node.namedChild(0)!.text
    const binding = new IdentifierBinding(
      name,
      new ParametricType(LIST_TYPE, [new TypeVariable()]),
      { isImplicit: true },
    )
    this.addBinding(binding)

    if (node.namedChildCount == 3) this.traverse(node.namedChild(2)!)
  }

  private handleIdentifier = (node: Parser.SyntaxNode): void => {
    const name = node.text

    if (this._scope.resolveBinding(name) === undefined)
      throw new MissingBindingError(name)
  }

  private handleImport = (node: Parser.SyntaxNode): void => {
    if (!(this._scope instanceof ModuleScope))
      throw new ImportOutsideFileModuleScopeError()

    const source = node.namedChild(1)!.text.slice(1, -1)
    const sourcePath = path.join(this._filePath, '..', source)
    if (!IMPORT_FILE_EXTENSIONS.find((regex) => regex.test(sourcePath)))
      throw new UnknownImportError(sourcePath)
    this._fileScope.addDependency(sourcePath)

    new BuildImportBindings(sourcePath)
      .perform(node)
      .forEach((binding) => this.addBinding(binding))
  }

  private handleListComprehension = (node: Parser.SyntaxNode): void => {
    this.enterBlock()

    this.traverse(node.namedChild(1)!)
    this.traverse(node.namedChild(0)!)

    this._scope.reduce()
    this.leaveBlock()
  }

  private handleModule = (node: Parser.SyntaxNode): void => {
    this.enableDeclaration()
    const isExported = this.disableExports()

    this.traverse(node.namedChild(1)!)

    const moduleScope = this._scope.lastNestedScope
    const exportedBindings = moduleScope.bindings.filter(
      (binding) => binding.isExported,
    )
    const representation = new BuildRepresentation().perform(
      RepresentationKind.Instance,
      exportedBindings,
    )

    const type = new BuildType().handleType(node.namedChild(0)!)
    const binding = new TypeBinding(type, representation, { isExported })
    this.addBinding(binding)
  }

  private handleParameters = (node: Parser.SyntaxNode): void => {
    new BuildPatternBindings({ isExported: false, isImplicit: true })
      .perform(node)
      .forEach((binding) => this.addBinding(binding))
  }

  private handlePatternList = (node: Parser.SyntaxNode): void => {
    const bindings = node.namedChildren.map((patternNode) => {
      return new BuildPatternBindings({
        isExported: false,
        isImplicit: true,
      }).perform(patternNode)
    })

    new UnifyPatternBindings()
      .perform(bindings)
      .forEach((binding) => this.addBinding(binding))
  }

  private handleWhenClause = (node: Parser.SyntaxNode): void => {
    this.enterBlock()

    this.traverse(node.namedChild(0)!)
    this.traverse(node.namedChild(1)!)

    this._scope.reduce()
    this.leaveBlock()
  }

  private enterBlock = (): void => {
    if (this.disableDeclaration())
      this._scope = this._scope.addNestedScope(new ModuleScope(this._scope))
    else this._scope = this._scope.addNestedScope(new NestedScope(this._scope))
  }

  private leaveBlock = (): void => {
    assert(
      this._scope.parentScope instanceof NestedScope,
      'Cannot leave file-level scope.',
    )

    this._scope = this._scope.parentScope
  }

  private enableDeclaration = (): void => {
    this._isDeclaration = true
  }

  private disableDeclaration = (): boolean => {
    const value = this._isDeclaration

    this._isDeclaration = false
    return value
  }

  private enableExports = (): void => {
    this._exportBindings = true
  }

  private disableExports = (): boolean => {
    const value = this._exportBindings

    this._exportBindings = false
    return value
  }

  private addBinding = (binding: Binding): void => {
    const matchingBinding = this._scope.resolveBinding(binding.name, 0)
    if (matchingBinding) throw new DuplicateBindingError(matchingBinding.name)

    this._scope.addBinding(binding)
  }
}
