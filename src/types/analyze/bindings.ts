import { ConstrainedType, Type } from '../type_inference/types'
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
  | ImportTypeNode
  | InterfaceNode
  | TypeAliasNode
  | TypeVariableDeclarationNode

export type ImportBindingConfig = {
  file: AbsolutePath
  originalName?: string
}

enum BindingKind {
  Term,
  Type,
}

interface AbstractBinding {
  name: string
  isExported: boolean
  importedFrom?: ImportBindingConfig
}

export interface TermBinding extends AbstractBinding {
  kind: typeof BindingKind.Term
  node: TermBindingNode
  /**
   * A binding is implicit when it stems from a generator, parameter or case,
   * but not when it stems from an assignment. Used for code generation.
   */
  isImplicit: boolean
}

export interface TypedTermBinding extends TermBinding {
  type: ConstrainedType<Type>
}

export interface TypeBinding extends AbstractBinding {
  kind: typeof BindingKind.Type
  node: TypeBindingNode
}

// ---- Factories ----

export const buildImportBindingConfig = (
  file: AbsolutePath,
  originalName?: string,
): ImportBindingConfig => ({
  file,
  originalName,
})

export const buildTermBinding = (
  name: string,
  node: TermBindingNode,
  isImplicit: boolean,
  isExported = false,
  importedFrom?: ImportBindingConfig,
): TermBinding => ({
  kind: BindingKind.Term,
  name,
  node,
  isExported,
  importedFrom,
  isImplicit,
})

export const buildTypeBinding = (
  name: string,
  node: TypeBindingNode,
  isExported = false,
  importedFrom?: ImportBindingConfig,
): TypeBinding => ({
  kind: BindingKind.Type,
  name,
  node,
  isExported,
  importedFrom,
})
