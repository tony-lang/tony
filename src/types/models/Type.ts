import { CurriedType } from './CurriedType'
import { TypeConstraints } from './TypeConstraints'

export abstract class Type {
  abstract concat: (type: Type) => CurriedType

  // combines two types in a disjunction, optionally unifies literals
  abstract disj: (type: Type, constraints?: TypeConstraints) => Type

  // applies curried arguments to type, and reduces
  abstract apply: (
    argumentTypes: CurriedType,
    constraints: TypeConstraints,
  ) => Type

  // unifies two types, and reduces
  abstract unify: (actual: Type, constraints: TypeConstraints) => Type
  abstract _unify: (actual: Type, constraints: TypeConstraints) => Type

  // simplifies type by applying constraints
  abstract _reduce: (constraints: TypeConstraints) => Type

  abstract toString: () => string
}
