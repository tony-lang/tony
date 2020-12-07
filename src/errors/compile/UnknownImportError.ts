import { Path } from '../../types/util'
import { CompileError, Context } from '../CompileError'

export class UnknownImportError extends CompileError {
  private _sourcePath: Path

  constructor(context: Context, sourcePath: Path) {
    super(context)
    this.name = this.constructor.name

    this._sourcePath = sourcePath
  }

  get sourcePath(): string {
    return this._sourcePath
  }
}
