import {
  ConstrainedType,
  ParametricType,
  Type,
  TypeVariable,
} from '../type_inference/types'
import { AbsolutePath } from '../path'
import { PrimitiveType } from '../type_inference/primitive_types'
import { SyntaxNode } from 'tree-sitter-tony'

// ---- Types ----

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
  node: SyntaxNode
  isExported: boolean
  importedFrom?: ImportBindingConfig
}

export interface TermBinding extends AbstractBinding {
  kind: typeof BindingKind.Term
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
  type: TypeVariable | ParametricType | PrimitiveType
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
  node: SyntaxNode,
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
  type: TypeVariable | ParametricType | PrimitiveType,
  node: SyntaxNode,
  isExported = false,
  importedFrom?: ImportBindingConfig,
): TypeBinding => ({
  kind: BindingKind.Type,
  name,
  type,
  node,
  isExported,
  importedFrom,
})
