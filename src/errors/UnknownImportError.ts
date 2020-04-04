import { CompileError } from './CompileError'

export class UnknownImportError extends CompileError {
  private _sourcePath: string

  constructor(sourcePath: string) {
    super(undefined)
    this.name = this.constructor.name

    this._sourcePath = sourcePath
  }

  get sourcePath(): string {
    return this._sourcePath
  }
}
