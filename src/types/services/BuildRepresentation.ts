import { Binding, IdentifierBinding, TypeBinding } from '../../symbol_table'
import {
  IdentifierProperty,
  Representation,
  RepresentationKind,
  TypeProperty,
} from '../models'
import { isNotUndefined } from '../../utilities'

export class BuildRepresentation {
  perform = (kind: RepresentationKind, bindings: Binding[]): Representation => {
    const properties = bindings
      .map((binding) => {
        if (binding instanceof IdentifierBinding)
          return new IdentifierProperty(binding.name, binding.type)
        else if (binding instanceof TypeBinding)
          return new TypeProperty(binding.type, binding.representation)
      })
      .filter(isNotUndefined)

    return new Representation(kind, properties)
  }
}
