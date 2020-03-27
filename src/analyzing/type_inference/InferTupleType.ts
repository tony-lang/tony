import {
  CurriedTypeConstructor,
  SingleTypeConstructor,
  TupleType,
  TypeConstructor
} from '../types'

export class InferTupleType {
  perform = (valueTypes: TypeConstructor[]): TypeConstructor => {
    const tupleValueTypes = valueTypes.reduce(
      this.collapseRestTypes,
      new CurriedTypeConstructor([])
    ).types

    return new SingleTypeConstructor(new TupleType(tupleValueTypes))
  }

  private collapseRestTypes = (
    valueTypes: CurriedTypeConstructor,
    valueType: TypeConstructor
  ): CurriedTypeConstructor => {
    if (valueType instanceof SingleTypeConstructor &&
        valueType.type instanceof TupleType && valueType.type.isRest)
      return valueTypes.concat(new CurriedTypeConstructor(valueType.type.types))
    else return valueTypes.concat(valueType)
  }
}
