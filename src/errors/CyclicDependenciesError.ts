import { CompileError } from './CompileError'

export class CyclicDependenciesError extends CompileError {
  private _cyclicDependency: [string, string]

  constructor(cyclicDependency: [string, string]) {
    super(undefined)
    this.name = this.constructor.name

    this._cyclicDependency = cyclicDependency
  }

  get cyclicDependency(): [string, string] {
    return this._cyclicDependency
  }
}
