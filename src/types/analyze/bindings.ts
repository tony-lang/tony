import { DeclaredType, ResolvedType, Type } from '../type_inference/categories'
import {
  DestructuringPatternNode,
  EnumNode,
  EnumValueNode,
  GeneratorNode,
  IdentifierPatternNode,
  ImportTypeNode,
  InterfaceNode,
  MemberTypeNode,
  RefinementTypeDeclarationNode,
  ShorthandMemberPatternNode,
  TaggedTypeNode,
  TypeAliasNode,
  TypeVariableDeclarationNode,
} from 'tree-sitter-tony'
import { AbsolutePath } from '../path'
import { Constraints } from '../type_inference/constraints'
import { TypeVariable } from '../type_inference/types'

// ---- Types ----

export type TermBindingNode =
  | DestructuringPatternNode
  | EnumValueNode
  | GeneratorNode
  | IdentifierPatternNode
  | ShorthandMemberPatternNode
  | TaggedTypeNode
  | RefinementTypeDeclarationNode
  | MemberTypeNode

export type TypeBindingNode = EnumNode | InterfaceNode | TypeAliasNode

type AbstractBinding = {
  name: string
  isExported: boolean
}

enum BindingKind {
  Term,
  Type,
  TypeVariable,
}

type AbstractTermBinding = AbstractBinding & {
  kind: typeof BindingKind.Term
  node: TermBindingNode
  /**
   * The index tracks the number of times a binding is overloaded. Among all
   * bindings with a given name that have overlapping scopes, index is a unique
   * identifier.
   */
  index: number
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

export type ImportedTypeBinding = AbstractTypeBinding &
  ImportedBinding & { node: ImportTypeNode }
export type LocalTypeBinding = AbstractTypeBinding &
  LocalBinding & {
    node: TypeBindingNode
    value: DeclaredType
    alias: Type
  }
export type TypeBinding = ImportedTypeBinding | LocalTypeBinding

export type TypeVariableBinding = AbstractBinding & {
  kind: typeof BindingKind.TypeVariable
  node: TypeVariableDeclarationNode
  value: TypeVariable
  constraints: Constraints
}

/**
 * A type assignment assigns a type to a term binding.
 */
export type TypeAssignment = TermBinding & {
  type: ResolvedType
}

// ---- Factories ----

export const buildImportedTermBinding = (
  file: AbsolutePath,
  name: string,
  index: number,
  originalName: string | undefined,
  node: TermBindingNode,
  isImplicit: boolean,
  isExported = false,
): ImportedTermBinding => ({
  kind: BindingKind.Term,
  location: BindingLocation.Imported,
  name,
  index,
  node,
  isExported,
  isImplicit,
  file,
  originalName,
})

export const buildLocalTermBinding = (
  name: string,
  index: number,
  node: TermBindingNode,
  isImplicit: boolean,
  isExported = false,
): LocalTermBinding => ({
  kind: BindingKind.Term,
  location: BindingLocation.Local,
  name,
  index,
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
  name: string,
  value: DeclaredType,
  alias: Type,
  node: TypeBindingNode,
  isExported = false,
): LocalTypeBinding => ({
  kind: BindingKind.Type,
  location: BindingLocation.Local,
  name,
  node,
  isExported,
  value,
  alias,
})

export const buildTypeVariableBinding = (
  name: string,
  node: TypeVariableDeclarationNode,
  value: TypeVariable,
  constraints: Constraints,
): TypeVariableBinding => ({
  kind: BindingKind.TypeVariable,
  name,
  node,
  isExported: false,
  value,
  constraints,
})

export const buildTypeAssignment = (
  binding: TermBinding,
  type: ResolvedType,
): TypeAssignment => ({
  ...binding,
  type,
})

export const isImportedBinding = (binding: {
  location: BindingLocation
}): binding is ImportedBinding => binding.location === BindingLocation.Imported

export const isLocalBinding = (binding: {
  location: BindingLocation
}): binding is LocalBinding => binding.location === BindingLocation.Local
