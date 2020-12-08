import { CyclicDependency, Path } from '..'

export abstract class CompileError extends Error {}

export class CyclicDependencyError extends CompileError {
  private _cyclicDependency: CyclicDependency<Path>

  constructor(cyclicDependency: CyclicDependency<Path>) {
    super()
    this.name = this.constructor.name

    this._cyclicDependency = cyclicDependency
  }

  get cyclicDependency(): CyclicDependency<Path> {
    return this._cyclicDependency
  }
}

export class UnknownEntryError extends CompileError {
  private _sourcePath: string

  constructor(sourcePath: string) {
    super()
    this.name = this.constructor.name

    this._sourcePath = sourcePath
  }

  get sourcePath(): string {
    return this._sourcePath
  }
}
