import { ProgramNode, SyntaxNode } from 'tree-sitter-tony'
import { AbsolutePath } from '../paths'
import { PRIMITIVE_TYPES } from '../../constants'

// ---- Types ----

export type ImportBindingConfig = {
  file: AbsolutePath
  originalName?: string
}

export enum BindingKind {
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
   * but not when it stems from an assignment or a module.
   */
  isImplicit: boolean
}

export interface TypeBinding extends AbstractBinding {
  kind: typeof BindingKind.Type
  isVariable: boolean
  /**
   * A binding is primitive if it represents one of the primitive types.
   */
  isPrimitive: boolean
}

export type Binding = TermBinding | TypeBinding

export type Bindings = {
  terms: TermBinding[]
  types: TypeBinding[]
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
  node: SyntaxNode,
  isVariable: boolean,
  isExported = false,
  importedFrom?: ImportBindingConfig,
): TypeBinding => ({
  kind: BindingKind.Type,
  name,
  node,
  isExported,
  importedFrom,
  isVariable,
  isPrimitive: false,
})

const buildPrimitiveTypeBindings = (node: ProgramNode): TypeBinding[] =>
  PRIMITIVE_TYPES.map((name) => ({
    kind: BindingKind.Type,
    name,
    node,
    isExported: false,
    isVariable: false,
    isPrimitive: true,
  }))

export const buildBindings = (
  from: Bindings,
  terms: TermBinding[],
  types: TypeBinding[],
): Bindings => ({
  terms: [...from.terms, ...terms],
  types: [...from.types, ...types],
})

export const initializeBindings = (node?: ProgramNode): Bindings => ({
  terms: [],
  types: node ? buildPrimitiveTypeBindings(node) : [],
})
