import { ConstrainedType, Type } from '../types/type_inference/types'
import { FileScope, TypedFileScope } from '../types/analyze/scopes'
import { TermBinding, TypedTermBinding } from '../types/analyze/bindings'
import { addErrorToScope, findFileScope } from '../util/scopes'
import {
  buildUnknownFileError,
  buildUnknownImportError,
} from '../types/errors/annotations'
import { buildUnconstrainedUnknownType } from '../util/types'
import { findBinding } from '../util/bindings'

export const resolveTermBindingType = (
  fileScopes: TypedFileScope[],
  bindings: TypedTermBinding[][],
  binding: TermBinding,
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

  const importedBinding = findBinding(importedBindingName, [
    fileScope.typedBindings,
  ])
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
  bindings: TypedTermBinding[][],
  binding: TermBinding,
): ConstrainedType<Type> => {
  const typedBinding = findBinding(binding.name, bindings)
  return typedBinding?.type || buildUnconstrainedUnknownType()
}
