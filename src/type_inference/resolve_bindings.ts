import {
  DeclaredBinding,
  DeclaredTermBinding,
  LocalBinding,
  LocalTermBinding,
  LocalTypeBinding,
  TermBinding,
  TypeAssignment,
  TypeBinding,
  isDeclaredBinding,
  isImportedBinding,
  isLocalBinding,
  isTermBinding,
} from '../types/analyze/bindings'
import {
  DeclaredType,
  ResolvedType,
  Type,
} from '../types/type_inference/categories'
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
import { buildTemporaryTypeVariable } from '../types/type_inference/types'
import { isSamePath } from '../util/paths'

type StrongBinding<T extends TermBinding | TypeBinding> = T extends TermBinding
  ? TypeAssignment
  : TypeBinding
type WeakBinding<T extends TermBinding | TypeBinding> = T extends TermBinding
  ? TermBinding
  : TypeBinding

const resolveBindingType =
  <
    T extends TermBinding | TypeBinding,
    U extends ScopeWithErrors,
    V extends DeclaredType | Type,
    W,
  >(
    getBindings: (fileScope: TypedFileScope) => StrongBinding<T>[],
    resolveLocalBindingType: (
      binding: WeakBinding<T> & (DeclaredBinding | LocalBinding),
      bindings: StrongBinding<T>[][],
    ) => W,
    buildAnswer: (result?: W) => W,
  ) =>
  (
    fileScopes: TypedFileScope[],
    scope: U,
    bindings: StrongBinding<T>[][],
    binding: WeakBinding<T>,
  ): [type: W, newScope: U, newFileScopes: TypedFileScope[]] => {
    if (
      isLocalBinding(binding) ||
      (isTermBinding(binding) && isDeclaredBinding(binding))
    )
      return [
        buildAnswer(resolveLocalBindingType(binding, bindings)),
        scope,
        fileScopes,
      ]

    assert(
      isImportedBinding(binding),
      'When a binding is not local or declared it must be imported.',
    )

    const importedBindingName = binding.originalName || binding.name
    const fileScope = findFileScope(fileScopes, binding.dependency)
    if (fileScope === undefined)
      return [
        buildAnswer(),
        addErrorToScope(
          scope,
          binding.node,
          buildUnknownFileError(binding.dependency.file),
        ),
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
          buildUnknownImportError(binding.dependency.file, importedBindingName),
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
      isSamePath(fileScope.dependency.file, newFileScope.dependency.file)
        ? newFileScope
        : fileScope,
    )
    return [type, scope, newFileScopesWithNewFileScope]
  }

const buildAnswers = <T extends Type | DeclaredType>(answers?: T[]) =>
  answers || [buildTemporaryTypeVariable()]

const buildAnswer = <T extends Type | DeclaredType>(answer?: T) =>
  answer || buildTemporaryTypeVariable()

const resolveTermBindingTypeWithinScope = (
  binding: DeclaredTermBinding | LocalTermBinding,
  typeAssignments: TypeAssignment[][],
): ResolvedType[] => {
  const bindings = findBindings(binding.name, typeAssignments)
  if (bindings.length > 0) return bindings.map((binding) => binding.type)
  return [buildTemporaryTypeVariable()]
}

/**
 * Returns the type of a term binding.
 */
export const resolveTermBindingType = resolveBindingType<
  TermBinding,
  ScopeWithErrors,
  Type,
  ResolvedType[]
>(getTypeAssignments, resolveTermBindingTypeWithinScope, buildAnswers)

const resolveAliasTypeWithinScope = (typeBinding: LocalTypeBinding) =>
  typeBinding.value

/**
 * Returns the type declared by a type binding.
 */
export const resolveAliasType = resolveBindingType<
  TypeBinding,
  ScopeWithErrors,
  DeclaredType,
  DeclaredType
>(getTypes, resolveAliasTypeWithinScope, buildAnswer)

const resolveAliasedTypeWithinScope = (typeBinding: LocalTypeBinding) =>
  typeBinding.alias

/**
 * Returns the type represented by a type binding.
 */
export const resolveAliasedType = resolveBindingType<
  TypeBinding,
  ScopeWithErrors,
  Type,
  Type
>(getTypes, resolveAliasedTypeWithinScope, buildAnswer)
