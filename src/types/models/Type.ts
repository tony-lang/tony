import { CurriedType } from './CurriedType'
import { TypeConstraints } from './TypeConstraints'
import { UnionType } from './UnionType'

export abstract class Type {
  abstract concat: (type: Type) => CurriedType

  //
  abstract disj: (type: Type, constraints: TypeConstraints) => Type

  //
  abstract apply: (argumentTypes: CurriedType, constraints: TypeConstraints) => Type

  //
  abstract unify: (actual: Type, constraints: TypeConstraints) => Type
  abstract _unify: (actual: Type, constraints: TypeConstraints) => Type

  //
  abstract _reduce: (constraints: TypeConstraints) => Type

  abstract toString: () => string
}
