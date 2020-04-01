import { CurriedType } from './CurriedType'
import { TypeConstraints } from './TypeConstraints'

export abstract class Type {
  abstract concat: (type: Type) => CurriedType

  abstract unify: (actual: Type, constraints: TypeConstraints) => Type
  abstract _unify: (actual: Type, constraints: TypeConstraints) => Type
  abstract _reduce: (constraints: TypeConstraints) => Type

  abstract isComplete: () => boolean
  abstract toString: () => string
}
