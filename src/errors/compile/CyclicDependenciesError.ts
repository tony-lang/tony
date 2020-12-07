import { CyclicDependency, Path } from '../../types/util'
import { CompileError, Context } from '../CompileError'

export class CyclicDependenciesError extends CompileError {
  private _cyclicDependency: CyclicDependency<Path>

  constructor(context: Context, cyclicDependency: CyclicDependency<Path>) {
    super(context)
    this.name = this.constructor.name

    this._cyclicDependency = cyclicDependency
  }

  get cyclicDependency(): CyclicDependency<Path> {
    return this._cyclicDependency
  }
}
