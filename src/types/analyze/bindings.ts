import {
  ClassNode,
  DestructuringPatternNode,
  EnumNode,
  EnumValueNode,
  GeneratorNode,
  IdentifierPatternNameNode,
  IdentifierPatternNode,
  ImportTypeNode,
  MemberTypeNode,
  RefinementTypeDeclarationNode,
  ShorthandMemberPatternNode,
  TaggedTypeNode,
  TypeAliasNode,
  TypeVariableDeclarationNode,
} from 'tree-sitter-tony/tony'
import {
  Constraints,
  DeferredTypeVariableAssignment,
} from '../type_inference/constraints'
import { DeclaredType, ResolvedType, Type } from '../type_inference/categories'
import { Dependency } from './dependencies'
import { TypeVariable } from '../type_inference/types'

// ---- Types ----

export type TermBindingNode =
  | DestructuringPatternNode
  | EnumValueNode
  | GeneratorNode
  | IdentifierPatternNode
  | IdentifierPatternNameNode
  | ShorthandMemberPatternNode
  | TaggedTypeNode
  | RefinementTypeDeclarationNode
  | MemberTypeNode

export type TypeBindingNode = ClassNode | EnumNode | TypeAliasNode

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
  Imported,
  Local,
}

export type ImportedBinding = {
  readonly location: typeof BindingLocation.Imported
  readonly dependency: Dependency
  readonly originalName?: string
}

export type LocalBinding = {
  readonly location: typeof BindingLocation.Local
}

export type ImportedTermBinding = AbstractTermBinding & ImportedBinding
export type LocalTermBinding = AbstractTermBinding & LocalBinding
export type TermBinding = ImportedTermBinding | LocalTermBinding

export type ImportedTypeBinding = AbstractTypeBinding &
  ImportedBinding & { readonly node: ImportTypeNode }
export type LocalTypeBinding = AbstractTypeBinding &
  LocalBinding & {
    readonly node: TypeBindingNode
    readonly value: DeclaredType
    readonly alias: Type
    readonly deferredAssignments: DeferredTypeVariableAssignment[]
  }
export type TypeBinding = ImportedTypeBinding | LocalTypeBinding

export type TypeVariableBinding = AbstractBinding & {
  readonly kind: typeof BindingKind.TypeVariable
  readonly node: TypeVariableDeclarationNode
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
  node: ImportTypeNode,
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
  node: TypeBindingNode,
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
  node: TypeVariableDeclarationNode,
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

export const isImportedBinding = <T extends TermBinding | TypeBinding>(
  binding: T,
): binding is T & ImportedBinding =>
  binding.location === BindingLocation.Imported

export const isLocalBinding = <T extends TermBinding | TypeBinding>(
  binding: T,
): binding is T & LocalBinding => binding.location === BindingLocation.Local
