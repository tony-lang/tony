import * as Declaration from 'tree-sitter-tony/dtn'
import * as Source from 'tree-sitter-tony/tony'
import {
  Constraints,
  DeferredTypeVariableAssignment,
} from '../type_inference/constraints'
import { DeclaredType, ResolvedType, Type } from '../type_inference/categories'
import { Dependency } from './dependencies'
import { TypeVariable } from '../type_inference/types'

// ---- Types ----

export type TermBindingNode =
  | Source.DestructuringPatternNode
  | Source.EnumValueNode
  | Source.GeneratorNode
  | Source.IdentifierPatternNode
  | Source.IdentifierPatternNameNode
  | Source.ShorthandMemberPatternNode
  | Source.TaggedTypeNode
  | Source.RefinementTypeDeclarationNode
  | Source.MemberTypeNode
  | Declaration.DeclarationMemberNode

export type ImportedTypeBindingNode =
  | Declaration.ImportTypeNode
  | Source.ImportTypeNode
export type LocalTypeBindingNode =
  | Source.ClassNode
  | Source.EnumNode
  | Source.TypeAliasNode

type AbstractBinding = {
  readonly name: string
  readonly isExported: boolean
}

enum BindingKind {
  Term,
  Type,
  TypeVariable,
}

type AbstractTermBinding = AbstractBinding & {
  readonly kind: typeof BindingKind.Term
  readonly node: TermBindingNode
}

type SourceTermBinding = AbstractTermBinding & {
  /**
   * The index tracks the number of times a binding is overloaded. Among all
   * bindings with a given name that have overlapping scopes, index is a unique
   * identifier.
   */
  readonly index: number
  /**
   * A binding is implicit when it stems from a generator, parameter or case,
   * but not when it stems from an assignment. Used for code generation.
   */
  readonly isImplicit: boolean
}

type AbstractTypeBinding = AbstractBinding & {
  readonly kind: typeof BindingKind.Type
}

enum BindingLocation {
  Declared,
  Imported,
  Local,
}

export type DeclaredBinding = {
  readonly location: typeof BindingLocation.Declared
}

export type ImportedBinding = {
  readonly location: typeof BindingLocation.Imported
  readonly dependency: Dependency
  readonly originalName?: string
}

export type LocalBinding = {
  readonly location: typeof BindingLocation.Local
}

export type DeclaredTermBinding = AbstractTermBinding & DeclaredBinding
export type ImportedTermBinding = SourceTermBinding & ImportedBinding
export type LocalTermBinding = SourceTermBinding & LocalBinding
export type TermBinding =
  | DeclaredTermBinding
  | ImportedTermBinding
  | LocalTermBinding

export type ImportedTypeBinding = AbstractTypeBinding &
  ImportedBinding & { readonly node: ImportedTypeBindingNode }
export type LocalTypeBinding = AbstractTypeBinding &
  LocalBinding & {
    readonly node: LocalTypeBindingNode
    readonly value: DeclaredType
    readonly alias: Type
    readonly deferredAssignments: DeferredTypeVariableAssignment[]
  }
export type TypeBinding = ImportedTypeBinding | LocalTypeBinding

export type TypeVariableBinding = AbstractBinding & {
  readonly kind: typeof BindingKind.TypeVariable
  readonly node: Source.TypeVariableDeclarationNode
  readonly value: TypeVariable
  readonly constraints: Constraints<Type>
}

/**
 * A type assignment assigns a type to a term binding.
 */
export type TypeAssignment = TermBinding & {
  readonly type: ResolvedType
}

// ---- Factories ----

export const buildDeclaredTermBinding = (
  name: string,
  node: TermBindingNode,
): DeclaredTermBinding => ({
  kind: BindingKind.Term,
  location: BindingLocation.Declared,
  name,
  node,
  isExported: true,
})

export const buildImportedTermBinding = (
  dependency: Dependency,
  name: string,
  index: number,
  originalName: string | undefined,
  node: TermBindingNode,
  isImplicit: boolean,
  isExported: boolean,
): ImportedTermBinding => ({
  kind: BindingKind.Term,
  location: BindingLocation.Imported,
  name,
  index,
  node,
  isExported,
  isImplicit,
  dependency,
  originalName,
})

export const buildLocalTermBinding = (
  name: string,
  index: number,
  node: TermBindingNode,
  isImplicit: boolean,
  isExported: boolean,
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
  dependency: Dependency,
  name: string,
  originalName: string | undefined,
  node: ImportedTypeBindingNode,
  isExported: boolean,
): ImportedTypeBinding => ({
  kind: BindingKind.Type,
  location: BindingLocation.Imported,
  name,
  node,
  isExported,
  dependency,
  originalName,
})

export const buildLocalTypeBinding = (
  name: string,
  value: DeclaredType,
  alias: Type,
  node: LocalTypeBindingNode,
  deferredAssignments: DeferredTypeVariableAssignment[],
  isExported: boolean,
): LocalTypeBinding => ({
  kind: BindingKind.Type,
  location: BindingLocation.Local,
  name,
  node,
  isExported,
  value,
  alias,
  deferredAssignments,
})

export const buildTypeVariableBinding = (
  name: string,
  node: Source.TypeVariableDeclarationNode,
  value: TypeVariable,
  constraints: Constraints<Type>,
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

export const isTermBinding = (binding: {
  kind: BindingKind
}): binding is TermBinding => binding.kind === BindingKind.Term

export const isDeclaredBinding = (
  binding: TermBinding,
): binding is DeclaredTermBinding =>
  binding.location === BindingLocation.Declared

export const isImportedBinding = <T extends TermBinding | TypeBinding>(
  binding: T,
): binding is T & ImportedBinding =>
  binding.location === BindingLocation.Imported

export const isLocalBinding = <T extends TermBinding | TypeBinding>(
  binding: T,
): binding is T & LocalBinding => binding.location === BindingLocation.Local
