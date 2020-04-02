import {
  ParametricType,
  Type,
  TypeConstraints,
  TypeVariable,
  LIST_TYPE
} from '../types'

export class InferListType {
  private typeConstraints: TypeConstraints

  constructor(typeConstraints: TypeConstraints) {
    this.typeConstraints = typeConstraints
  }

  perform = (valueTypes: Type[]): ParametricType => valueTypes
    .reduce((valueType: ParametricType, otherValueType) => {
      return valueType.unify(
        new ParametricType(LIST_TYPE, [otherValueType]),
        this.typeConstraints
      )
    }, new ParametricType(LIST_TYPE, [new TypeVariable]))
}
