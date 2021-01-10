import {
  ConstrainedType,
  ResolvedConstrainedType,
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
import { findBinding, findBindings } from '../util/bindings'
import { assert } from '../types/errors/internal'
import { buildUnconstrainedUnknownType } from '../util/types'
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
  V extends DeclaredType | Type,
  W
>(
  getBindings: (fileScope: TypedFileScope) => StrongBinding<T>[],
  resolveLocalBindingType: (
    binding: WeakBinding<T> & LocalBinding,
    bindings: StrongBinding<T>[][],
  ) => W,
  buildAnswer: (result?: W) => W,
) => (
  fileScopes: TypedFileScope[],
  scope: U,
  bindings: StrongBinding<T>[][],
  binding: WeakBinding<T>,
): [type: W, newScope: U, newFileScopes: TypedFileScope[]] => {
  if (isLocalBinding(binding))
    return [
      buildAnswer(resolveLocalBindingType(binding, bindings)),
      scope,
      fileScopes,
    ]

  assert(
    isImportedBinding(binding),
    'When a binding is not local it must be imported.',
  )

  const importedBindingName = binding.originalName || binding.name
  const fileScope = findFileScope(fileScopes, binding.file)
  if (fileScope === undefined)
    return [
      buildAnswer(),
      addErrorToScope(scope, binding.node, buildUnknownFileError(binding.file)),
      fileScopes,
    ]

  const importedBindings = [getBindings(fileScope)]
  const importedBinding = findBinding(importedBindingName, importedBindings)
  if (importedBinding === undefined || !importedBinding.isExported)
    return [
      buildAnswer(),
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
    V,
    W
  >(getBindings, resolveLocalBindingType, buildAnswer)(
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

const buildAnswers = <T extends Type | DeclaredType, U extends Type>(
  answers?: ConstrainedType<T, U>[],
): ConstrainedType<T | TypeVariable, U>[] =>
  answers || [buildUnconstrainedUnknownType()]

const buildAnswer = <T extends Type | DeclaredType, U extends Type>(
  answer?: ConstrainedType<T, U>,
): ConstrainedType<T | TypeVariable, U> =>
  answer || buildUnconstrainedUnknownType()

const resolveTermBindingTypeWithinScope = (
  binding: LocalTermBinding,
  typeAssignments: TypeAssignment<ResolvedType>[][],
): ResolvedConstrainedType[] => {
  const bindings = findBindings(binding.name, typeAssignments)
  if (bindings.length > 0) return bindings.map((binding) => binding.type)
  return [buildUnconstrainedUnknownType()]
}

/**
 * Returns the type of a term binding.
 */
export const resolveTermBindingType = resolveBindingType<
  TermBinding,
  ScopeWithErrors,
  Type,
  ResolvedConstrainedType[]
>(getTypeAssignments, resolveTermBindingTypeWithinScope, buildAnswers)

const resolveAliasTypeWithinScope = (typeBinding: LocalTypeBinding) =>
  buildConstrainedType(typeBinding.value)

/**
 * Returns the type declared by a type binding.
 */
export const resolveAliasType = resolveBindingType<
  TypeBinding,
  ScopeWithErrors,
  DeclaredType,
  ConstrainedType<DeclaredType, Type>
>(getTypes, resolveAliasTypeWithinScope, buildAnswer)

const resolveAliasedTypeWithinScope = (typeBinding: LocalTypeBinding) =>
  buildConstrainedType(typeBinding.alias)

/**
 * Returns the type represented by a type binding.
 */
export const resolveAliasedType = resolveBindingType<
  TypeBinding,
  ScopeWithErrors,
  UnresolvedType,
  ConstrainedType<UnresolvedType, Type>
>(getTypes, resolveAliasedTypeWithinScope, buildAnswer)
