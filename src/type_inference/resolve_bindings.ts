import { ConstrainedType, Type } from '../types/type_inference/types'
import { ScopeWithErrors, TypedFileScope } from '../types/analyze/scopes'
import {
  TermBinding,
  TypeBinding,
  TypedTermBinding,
} from '../types/analyze/bindings'
import {
  addErrorToScope,
  findFileScope,
  getTypeBindings,
  getTypedTermBindings,
} from '../util/scopes'
import {
  buildUnknownFileError,
  buildUnknownImportError,
} from '../types/errors/annotations'
import { Buffer } from '../types/buffer'
import { SyntaxType } from 'tree-sitter-tony'
import { assert } from '../types/errors/internal'
import { buildUnconstrainedUnknownType } from '../util/types'
import { findBinding } from '../util/bindings'
import { isSamePath } from '../util/paths'
import { resolveType } from './resolve_type'

type StrongBinding<T extends TermBinding | TypeBinding> = T extends TermBinding
  ? TypedTermBinding
  : TypeBinding
type WeakBinding<T extends TermBinding | TypeBinding> = T extends TermBinding
  ? TermBinding
  : TypeBinding

const resolveBindingType = <
  T extends TermBinding | TypeBinding,
  U extends ScopeWithErrors
>(
  getBindings: (fileScope: TypedFileScope) => StrongBinding<T>[],
  resolveTypeWithinScope: (
    bindings: Buffer<StrongBinding<T>[]>,
    binding: WeakBinding<T>,
  ) => ConstrainedType<Type>,
) => (
  fileScopes: TypedFileScope[],
  scope: U,
  bindings: Buffer<StrongBinding<T>[]>,
  binding: WeakBinding<T>,
): [
  type: ConstrainedType<Type>,
  newScope: U,
  newFileScopes: TypedFileScope[],
] => {
  if (binding.importedFrom === undefined)
    return [resolveTypeWithinScope(bindings, binding), scope, fileScopes]

  const { file, originalName } = binding.importedFrom
  const importedBindingName = originalName || binding.name
  const fileScope = findFileScope(fileScopes, file)
  if (fileScope === undefined)
    return [
      buildUnconstrainedUnknownType(),
      addErrorToScope(scope, binding.node, buildUnknownFileError(file)),
      fileScopes,
    ]

  const importedBindings = [getBindings(fileScope)]
  const importedBinding = findBinding(importedBindingName, importedBindings)
  if (importedBinding === undefined || !importedBinding.isExported)
    return [
      buildUnconstrainedUnknownType(),
      addErrorToScope(
        scope,
        binding.node,
        buildUnknownImportError(file, importedBindingName),
      ),
      fileScopes,
    ]

  const [type, newFileScope, newFileScopes] = resolveBindingType<
    T,
    TypedFileScope
  >(getBindings, resolveTypeWithinScope)(
    fileScopes,
    fileScope,
    importedBindings,
    importedBinding,
  )
  const newFileScopesWithNewFileScope = newFileScopes.map((fileScope) =>
    isSamePath(fileScope.file, newFileScope.file) ? newFileScope : fileScope,
  )
  return [type, scope, newFileScopesWithNewFileScope]
}

const resolveTermBindingTypeWithinScope = (
  bindings: Buffer<TypedTermBinding[]>,
  binding: TermBinding,
) => {
  const typedBinding = findBinding(binding.name, bindings)
  return typedBinding?.type || buildUnconstrainedUnknownType()
}

export const resolveTermBindingType = resolveBindingType<
  TermBinding,
  ScopeWithErrors
>(getTypedTermBindings, resolveTermBindingTypeWithinScope)

const resolveTypeBindingTypeWithinScope = (
  typeBindings: Buffer<TypeBinding[]>,
  typeBinding: TypeBinding,
) => {
  assert(
    typeBinding.node.type !== SyntaxType.ImportType,
    'Bindings arising from an ImportTypeNode should have an import binding config.',
  )
  return resolveType(typeBindings, typeBinding.node)
}

export const resolveTypeBindingType = resolveBindingType<
  TypeBinding,
  ScopeWithErrors
>(getTypeBindings, resolveTypeBindingTypeWithinScope)
