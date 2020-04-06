import {
  LIST_TYPE,
  ParametricType,
  Type,
  TypeConstraints,
  TypeVariable,
} from '../../types'

export class InferListType {
  private _typeConstraints: TypeConstraints

  constructor(typeConstraints: TypeConstraints) {
    this._typeConstraints = typeConstraints
  }

  perform = (valueTypes: Type[]): ParametricType =>
    valueTypes.reduce((valueType: ParametricType, otherValueType) => {
      return valueType.unify(
        new ParametricType(LIST_TYPE, [otherValueType]),
        this._typeConstraints,
      )
    }, new ParametricType(LIST_TYPE, [new TypeVariable()]))
}
