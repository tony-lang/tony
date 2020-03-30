import { CurriedType } from './CurriedType'
import { TypeConstraints } from './TypeConstraints'

export abstract class Type {
  abstract concat: (type: Type) => CurriedType

  abstract unify: (type: Type, constraints: TypeConstraints) => Type
  abstract applyConstraints: (constraints: TypeConstraints) => Type

  abstract isComplete: () => boolean
  abstract toString: () => string
}
