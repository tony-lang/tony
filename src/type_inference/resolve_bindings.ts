import {
  ConstrainedType,
  DeclaredType,
  ResolvedType,
  Type,
  TypeVariable,
  UnresolvedType,
  buildConstrainedType,
} from '../types/type_inference/types'
import {
  LocalBinding,
  LocalTermBinding,
  LocalTypeBinding,
  TermBinding,
  TypeBinding,
  TypedTermBinding,
  isImportedBinding,
  isLocalBinding,
} from '../types/analyze/bindings'
import { ScopeWithErrors, TypedFileScope } from '../types/analyze/scopes'
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
import { assert } from '../types/errors/internal'
import { buildUnconstrainedUnknownType } from '../util/types'
import { findBinding } from '../util/bindings'
import { isSamePath } from '../util/paths'

type StrongBinding<T extends TermBinding | TypeBinding> = T extends TermBinding
  ? TypedTermBinding<ResolvedType>
  : TypeBinding
type WeakBinding<T extends TermBinding | TypeBinding> = T extends TermBinding
  ? TermBinding
  : TypeBinding

const resolveBindingType = <
  T extends TermBinding | TypeBinding,
  U extends ScopeWithErrors,
  V extends DeclaredType | Type
>(
  getBindings: (fileScope: TypedFileScope) => StrongBinding<T>[],
  resolveLocalBindingType: (
    binding: WeakBinding<T> & LocalBinding,
    bindings: StrongBinding<T>[][],
  ) => ConstrainedType<V, UnresolvedType>,
) => (
  fileScopes: TypedFileScope[],
  scope: U,
  bindings: StrongBinding<T>[][],
  binding: WeakBinding<T>,
): [
  type: ConstrainedType<V | TypeVariable, UnresolvedType>,
  newScope: U,
  newFileScopes: TypedFileScope[],
] => {
  if (isLocalBinding(binding))
    return [resolveLocalBindingType(binding, bindings), scope, fileScopes]

  assert(
    isImportedBinding(binding),
    'When a binding is not local it must be imported.',
  )

  const importedBindingName = binding.originalName || binding.name
  const fileScope = findFileScope(fileScopes, binding.file)
  if (fileScope === undefined)
    return [
      buildUnconstrainedUnknownType(),
      addErrorToScope(scope, binding.node, buildUnknownFileError(binding.file)),
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
        buildUnknownImportError(binding.file, importedBindingName),
      ),
      fileScopes,
    ]

  const [type, newFileScope, newFileScopes] = resolveBindingType<
    T,
    TypedFileScope,
    V
  >(getBindings, resolveLocalBindingType)(
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
  binding: LocalTermBinding,
  bindings: TypedTermBinding<ResolvedType>[][],
) => {
  const typedBinding = findBinding(binding.name, bindings)
  return typedBinding?.type || buildUnconstrainedUnknownType()
}

/**
 * Returns the type of a term binding.
 */
export const resolveTermBindingType = resolveBindingType<
  TermBinding,
  ScopeWithErrors,
  Type
>(getTypedTermBindings, resolveTermBindingTypeWithinScope)

const resolveTypeBindingTypeWithinScope = (typeBinding: LocalTypeBinding) =>
  buildConstrainedType(typeBinding.type, typeBinding.constraints)

/**
 * Returns the type declared by a type binding.
 */
export const resolveTypeBindingType = resolveBindingType<
  TypeBinding,
  ScopeWithErrors,
  DeclaredType
>(getTypeBindings, resolveTypeBindingTypeWithinScope)

const resolveTypeBindingValueTypeWithinScope = (
  typeBinding: LocalTypeBinding,
) => buildConstrainedType(typeBinding.value, typeBinding.constraints)

/**
 * Returns the type represented by a type binding.
 */
export const resolveTypeBindingValueType = resolveBindingType<
  TypeBinding,
  ScopeWithErrors,
  UnresolvedType
>(getTypeBindings, resolveTypeBindingValueTypeWithinScope)
