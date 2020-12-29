import {
  ConstrainedType,
  GenericType,
  Type,
  TypeVariable,
} from '../type_inference/types'
import {
  DestructuringPatternNode,
  EnumNode,
  EnumValueNode,
  GeneratorNode,
  IdentifierPatternNode,
  ImportTypeNode,
  InterfaceNode,
  NamedTypeNode,
  RefinementTypeDeclarationNode,
  ShorthandMemberPatternNode,
  TypeAliasNode,
  TypeVariableDeclarationNode,
} from 'tree-sitter-tony'
import { AbsolutePath } from '../path'
import { buildTypeBindingType } from '../../analyze/build_type'

// ---- Types ----

export type TermBindingNode =
  | DestructuringPatternNode
  | EnumValueNode
  | GeneratorNode
  | IdentifierPatternNode
  | ShorthandMemberPatternNode
  | NamedTypeNode
  | RefinementTypeDeclarationNode

export type TypeBindingNode =
  | EnumNode
  | InterfaceNode
  | TypeAliasNode
  | TypeVariableDeclarationNode

type AbstractBinding = {
  name: string
  isExported: boolean
}

enum BindingKind {
  Term,
  Type,
}

type AbstractTermBinding = AbstractBinding & {
  kind: typeof BindingKind.Term
  node: TermBindingNode
  /**
   * A binding is implicit when it stems from a generator, parameter or case,
   * but not when it stems from an assignment. Used for code generation.
   */
  isImplicit: boolean
}

type AbstractTypeBinding = AbstractBinding & {
  kind: typeof BindingKind.Type
}

enum BindingLocation {
  Imported,
  Local,
}

export type ImportedBinding = {
  location: typeof BindingLocation.Imported
  file: AbsolutePath
  originalName?: string
}

export type LocalBinding = {
  location: typeof BindingLocation.Local
}

export type ImportedTermBinding = AbstractTermBinding & ImportedBinding
export type LocalTermBinding = AbstractTermBinding & LocalBinding
export type TermBinding = ImportedTermBinding | LocalTermBinding
export type TypedTermBinding = TermBinding & {
  type: ConstrainedType<Type>
}

export type ImportedTypeBinding = AbstractTypeBinding &
  ImportedBinding & { node: ImportTypeNode }
export type LocalTypeBinding = AbstractTypeBinding &
  LocalBinding & {
    node: TypeBindingNode
    type: ConstrainedType<TypeVariable | GenericType>
  }
export type TypeBinding = ImportedTypeBinding | LocalTypeBinding

// ---- Factories ----

export const buildImportedTermBinding = (
  file: AbsolutePath,
  name: string,
  originalName: string | undefined,
  node: TermBindingNode,
  isImplicit: boolean,
  isExported = false,
): ImportedTermBinding => ({
  kind: BindingKind.Term,
  location: BindingLocation.Imported,
  name,
  node,
  isExported,
  isImplicit,
  file,
  originalName,
})

export const buildLocalTermBinding = (
  name: string,
  node: TermBindingNode,
  isImplicit: boolean,
  isExported = false,
): LocalTermBinding => ({
  kind: BindingKind.Term,
  location: BindingLocation.Local,
  name,
  node,
  isExported,
  isImplicit,
})

export const buildImportedTypeBinding = (
  file: AbsolutePath,
  name: string,
  originalName: string | undefined,
  node: ImportTypeNode,
  isExported = false,
): ImportedTypeBinding => ({
  kind: BindingKind.Type,
  location: BindingLocation.Imported,
  name,
  node,
  isExported,
  file,
  originalName,
})

export const buildLocalTypeBinding = (
  typeBindings: TypeBinding[][],
  name: string,
  node: TypeBindingNode,
  isExported = false,
): LocalTypeBinding => ({
  kind: BindingKind.Type,
  location: BindingLocation.Local,
  name,
  node,
  isExported,
  type: buildTypeBindingType(typeBindings)(node),
})

export const isImportedBinding = (binding: {
  location: BindingLocation
}): binding is ImportedBinding => binding.location === BindingLocation.Imported

export const isLocalBinding = (binding: {
  location: BindingLocation
}): binding is LocalBinding => binding.location === BindingLocation.Local
