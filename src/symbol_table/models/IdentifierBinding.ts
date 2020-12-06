import { Type, TypeConstraint } from '../../types'
import { Binding } from './Binding'
import Parser from 'tree-sitter'

export class IdentifierBinding implements Binding {
  private _filePath: string | undefined
  private _isExported: boolean
  private _isImplicit: boolean
  private _isImported: boolean
  private _name: string
  private _node: Parser.SyntaxNode
  private _transformedName: string
  private _transformedImportName: string | undefined
  protected _typeConstraint: TypeConstraint<Type>

  // eslint-disable-next-line max-lines-per-function
  constructor(
    node: Parser.SyntaxNode,
    name: string,
    transformedName: string,
    typeConstraint: TypeConstraint<Type>,
    {
      isExported = false,
      isImplicit = false,
      importInformation,
    }: {
      isExported?: boolean
      isImplicit?: boolean
      importInformation?: {
        filePath: string
        transformedImportName: string
      }
    } = {
      isExported: false,
      isImplicit: false,
    },
  ) {
    this._filePath = importInformation?.filePath
    this._isExported = isExported
    this._isImplicit = isImplicit
    this._isImported = importInformation !== undefined
    this._name = name
    this._node = node
    this._transformedName = transformedName
    this._transformedImportName = importInformation?.transformedImportName
    this._typeConstraint = typeConstraint
  }

  get filePath(): string | undefined {
    return this._filePath
  }

  get isExported(): boolean {
    return this._isExported
  }

  get isImplicit(): boolean {
    return this._isImplicit
  }

  get isImported(): boolean {
    return this._isImported
  }

  get name(): string {
    return this._name
  }

  get node(): Parser.SyntaxNode {
    return this._node
  }

  get typeConstraint(): TypeConstraint<Type> {
    return this._typeConstraint
  }

  set typeConstraint(value: TypeConstraint<Type>) {
    this._typeConstraint = value
  }

  get transformedName(): string {
    return this._transformedName
  }

  get transformedImportName(): string | undefined {
    return this._transformedImportName
  }
}
