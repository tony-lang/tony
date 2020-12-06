import { ModuleType, ParametricType } from '../../types'
import { Binding } from './Binding'
import Parser from 'tree-sitter'

export class ModuleBinding implements Binding {
  private _filePath: string | undefined
  private _isExported: boolean
  private _isImported: boolean
  private _name: ParametricType
  private _node: Parser.SyntaxNode
  private _transformedImportName: string | undefined
  private _type: ModuleType

  // eslint-disable-next-line max-lines-per-function
  constructor(
    node: Parser.SyntaxNode,
    name: ParametricType,
    type: ModuleType,
    {
      isExported = false,
      importInformation,
    }: {
      isExported?: boolean
      importInformation?: {
        filePath: string
        transformedImportName: string
      }
    } = {
      isExported: false,
    },
  ) {
    this._filePath = importInformation?.filePath
    this._isExported = isExported
    this._isImported = importInformation !== undefined
    this._name = name
    this._node = node
    this._transformedImportName = importInformation?.transformedImportName
    this._type = type
  }

  get filePath(): string | undefined {
    return this._filePath
  }

  get isExported(): boolean {
    return this._isExported
  }

  get isImplicit(): boolean {
    return this.isImported
  }

  get isImported(): boolean {
    return this._isImported
  }

  get name(): string {
    return this._name.name
  }

  get node(): Parser.SyntaxNode {
    return this._node
  }

  get transformedName(): string {
    return this.name
  }

  get transformedImportName(): string | undefined {
    return this._transformedImportName
  }

  get type(): ModuleType {
    return this._type
  }
}
