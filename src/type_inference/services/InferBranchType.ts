import * as AST from '../../ast'
import { Answer, Disjunction, GeneralizedDisjunction } from '../models'
import { Type, TypeConstraint, TypeVariable } from '../../types'
import { DistributeTypeDisjunction } from './DistributeTypeDisjunction'

type Factory<T, U> = (branches: T[]) => U

export class InferBranchType<
  T extends AST.SyntaxNode,
  U extends AST.SyntaxNode
> {
  private _factory: Factory<T, U>

  constructor(factory: Factory<T, U>) {
    this._factory = factory
  }

  perform = (branches: GeneralizedDisjunction<T>[]): Disjunction<U> =>
    new Disjunction(
      new DistributeTypeDisjunction<T>().perform(branches).map((branches) => {
        const typeConstraint = branches.typeConstraints.reduce(
          (acc: TypeConstraint<Type> | undefined, typeConstraint) => {
            if (acc === undefined) return

            return acc.unify(typeConstraint)
          },
          new TypeConstraint(new TypeVariable()),
        )
        if (typeConstraint === undefined) return

        return new Answer(this._factory(branches.nodes), typeConstraint)
      }),
    )
}
