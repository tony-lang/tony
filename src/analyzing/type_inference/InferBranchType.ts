import { Type, TypeConstraints } from '../types'

export class InferBranchType {
  private typeConstraints: TypeConstraints

  constructor(typeConstraints: TypeConstraints) {
    this.typeConstraints = typeConstraints
  }

  perform = (branchTypes: Type[]): Type => branchTypes
    .reduce((type, branchType) => type.unify(branchType, this.typeConstraints))
    ._reduce(this.typeConstraints)
}
