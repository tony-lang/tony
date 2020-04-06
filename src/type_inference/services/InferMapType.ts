import {
  MAP_TYPE,
  ParametricType,
  Type,
  TypeConstraints,
  TypeVariable,
} from '../../types'

export class InferMapType {
  private _typeConstraints: TypeConstraints

  constructor(typeConstraints: TypeConstraints) {
    this._typeConstraints = typeConstraints
  }

  perform = (mapTypes: Type[]): ParametricType =>
    mapTypes.reduce((mapType: ParametricType, otherMapType) => {
      return mapType.unify(otherMapType, this._typeConstraints)
    }, new ParametricType(MAP_TYPE, [new TypeVariable(), new TypeVariable()]))
}
