import {
  ConstrainedType,
  buildConstrainedType,
} from '../types/type_inference/constraints'
import {
  DeclaredType,
  ResolvedType,
  Type,
  TypeVariable,
  UnresolvedType,
} from '../types/type_inference/types'
import {
  LocalBinding,
  LocalTermBinding,
  LocalTypeBinding,
  TermBinding,
  TypeAssignment,
  TypeBinding,
  isImportedBinding,
  isLocalBinding,
} from '../types/analyze/bindings'
import { ScopeWithErrors, TypedFileScope } from '../types/analyze/scopes'
import {
  addErrorToScope,
  findFileScope,
  getTypeAssignments,
  getTypes,
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
  ? TypeAssignment<ResolvedType>
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
  typeAssignments: TypeAssignment<ResolvedType>[][],
) => {
  const typeAssignment = findBinding(binding.name, typeAssignments)
  return typeAssignment?.type || buildUnconstrainedUnknownType()
}

/**
 * Returns the type of a term binding.
 */
export const resolveTermBindingType = resolveBindingType<
  TermBinding,
  ScopeWithErrors,
  Type
>(getTypeAssignments, resolveTermBindingTypeWithinScope)

const resolveAliasTypeWithinScope = (typeBinding: LocalTypeBinding) =>
  buildConstrainedType(typeBinding.value)

/**
 * Returns the type declared by a type binding.
 */
export const resolveAliasType = resolveBindingType<
  TypeBinding,
  ScopeWithErrors,
  DeclaredType
>(getTypes, resolveAliasTypeWithinScope)

const resolveAliasedTypeWithinScope = (typeBinding: LocalTypeBinding) =>
  buildConstrainedType(typeBinding.alias)

/**
 * Returns the type represented by a type binding.
 */
export const resolveAliasedType = resolveBindingType<
  TypeBinding,
  ScopeWithErrors,
  UnresolvedType
>(getTypes, resolveAliasedTypeWithinScope)
