import { Type, TypeConstraints } from '../../types'

export class InferBranchType {
  private _typeConstraints: TypeConstraints

  constructor(typeConstraints: TypeConstraints) {
    this._typeConstraints = typeConstraints
  }

  perform = (branchTypes: Type[]): Type =>
    branchTypes
      .reduce((type, branchType) =>
        type.unify(branchType, this._typeConstraints),
      )
      ._reduce(this._typeConstraints)
}
