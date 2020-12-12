import { ProgramNode, SyntaxNode } from 'tree-sitter-tony'
import { PRIMITIVE_TYPES } from '../../constants'
import { AbsolutePath } from '../paths'

// ---- Types ----

export enum BindingKind {
  Term,
  Type,
}

export type ImportBindingConfig = {
  file: AbsolutePath
  originalName?: string
}

export interface Binding {
  kind: BindingKind
  name: string
  node: SyntaxNode
  isExported: boolean
  importedFrom?: ImportBindingConfig
  // A binding is implicit when it stems from a generator, parameter or case,
  // but not when it stems from an assignment or a module.
  isImplicit: boolean
  // A binding is primitive if it represents one of the primitive types.
  isPrimitive: boolean
}

export type Bindings = Record<BindingKind, Binding[]>

// ---- Factories ----

export const buildImportBindingConfig = (
  file: AbsolutePath,
  originalName?: string,
): ImportBindingConfig => ({
  file,
  originalName,
})

export const buildBinding = (
  kind: BindingKind,
  name: string,
  node: SyntaxNode,
  isImplicit: boolean,
  isExported = false,
  importedFrom?: ImportBindingConfig,
): Binding => ({
  kind,
  name,
  node,
  isExported,
  importedFrom,
  isImplicit,
  isPrimitive: false,
})

const buildPrimitiveTypeBindings = (node: ProgramNode): Binding[] =>
  PRIMITIVE_TYPES.map((name) => ({
    kind: BindingKind.Type,
    name,
    node,
    isExported: false,
    isImplicit: false,
    isPrimitive: true,
  }))

export const buildBindings = (
  primitiveTypeBindingNode?: ProgramNode,
): Bindings => ({
  [BindingKind.Term]: [],
  [BindingKind.Type]: primitiveTypeBindingNode
    ? buildPrimitiveTypeBindings(primitiveTypeBindingNode)
    : [],
})
