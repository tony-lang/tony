import { CyclicDependency } from '../../types/util'
import { InternalError } from '../InternalError'

export class TopologicalSortError extends InternalError {
  private _cyclicDependency: CyclicDependency<number>

  constructor(cyclicDependency: CyclicDependency<number>) {
    super('TopologicalSortErrors should be catched.')
    this.name = this.constructor.name

    this._cyclicDependency = cyclicDependency
  }

  get cyclicDependency(): CyclicDependency<number> {
    return this._cyclicDependency
  }
}
