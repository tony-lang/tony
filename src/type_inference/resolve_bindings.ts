import { Binding, TypedBinding, TypedBindings } from '../types/analyze/bindings'
import { ConstrainedType, Type } from '../types/type_inference/types'
import { FileScope, TypedFileScope } from '../types/analyze/scopes'
import { addErrorToScope, findFileScope, findItemByName } from '../util/analyze'
import {
  buildUnknownFileError,
  buildUnknownImportError,
} from '../types/errors/annotations'
import { buildUnconstrainedUnknownType } from '../util/types'

export const resolveBindingType = (
  fileScopes: TypedFileScope[],
  bindings: TypedBindings[],
  binding: Binding,
  scope: FileScope,
): [type: ConstrainedType<Type>, newScope: FileScope] => {
  if (binding.importedFrom === undefined)
    return [resolveBindingTypeWithinScope(bindings, binding), scope]

  const { file, originalName } = binding.importedFrom
  const importedBindingName = originalName || binding.name
  const fileScope = findFileScope(fileScopes, file)
  if (fileScope === undefined)
    return [
      buildUnconstrainedUnknownType(),
      addErrorToScope(scope, binding.node, buildUnknownFileError(file)),
    ]

  const importedBinding = findTypedBindingOf([fileScope.typedBindings], {
    ...binding,
    name: importedBindingName,
  })
  if (importedBinding === undefined || !importedBinding.isExported)
    return [
      buildUnconstrainedUnknownType(),
      addErrorToScope(
        scope,
        binding.node,
        buildUnknownImportError(file, importedBindingName),
      ),
    ]

  return [importedBinding.type, scope]
}

const resolveBindingTypeWithinScope = (
  bindings: TypedBindings[],
  binding: Binding,
): ConstrainedType<Type> => {
  const typedBinding = findTypedBindingOf(bindings, binding)
  return typedBinding?.type || buildUnconstrainedUnknownType()
}

const findTypedBindingOf = (
  bindings: TypedBindings[],
  reference: Binding,
): TypedBinding | undefined =>
  bindings.reduce<TypedBinding | undefined>((binding, bindings) => {
    if (binding !== undefined) return binding

    return findItemByName<TypedBinding>(
      reference.name,
      bindings[reference.kind],
    )
  }, undefined)
