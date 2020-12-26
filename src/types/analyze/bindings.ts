import { ConstrainedType, Type } from '../type_inference/types'
import { ProgramNode, SyntaxNode } from 'tree-sitter-tony'
import { AbsolutePath } from '../paths'
import { PRIMITIVE_TYPES } from '../../constants'

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
interface AbstractTypedBinding extends AbstractBinding {
  type: ConstrainedType<Type>
}

export interface TermBinding extends AbstractBinding {
  kind: typeof BindingKind.Term
  /**
   * A binding is implicit when it stems from a generator, parameter or case,
   * but not when it stems from an assignment or a module.
   */
  isImplicit: boolean
}
export interface TypedTermBinding extends TermBinding, AbstractTypedBinding {}

export interface TypeBinding extends AbstractBinding {
  kind: typeof BindingKind.Type
  isVariable: boolean
  /**
   * A binding is primitive if it represents one of the primitive types.
   */
  isPrimitive: boolean
}
export interface TypedTypeBinding extends TypeBinding, AbstractTypedBinding {}

export type Binding = TermBinding | TypeBinding
export type TypedBinding = TypedTermBinding | TypedTypeBinding

export type Bindings = {
  [BindingKind.Term]: TermBinding[]
  [BindingKind.Type]: TypeBinding[]
}
export type TypedBindings = {
  [BindingKind.Term]: TypedTermBinding[]
  [BindingKind.Type]: TypedTypeBinding[]
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
  [BindingKind.Term]: [...from[BindingKind.Term], ...terms],
  [BindingKind.Type]: [...from[BindingKind.Type], ...types],
})

export const initializeBindings = (node?: ProgramNode): Bindings => ({
  [BindingKind.Term]: [],
  [BindingKind.Type]: node ? buildPrimitiveTypeBindings(node) : [],
})

export const buildTypedBindings = (
  terms: TypedTermBinding[],
  types: TypedTypeBinding[],
): TypedBindings => ({
  [BindingKind.Term]: terms,
  [BindingKind.Type]: types,
})

export const getTerms = <T extends TermBinding>(
  bindings: Record<BindingKind.Term, T[]>,
): T[] => bindings[BindingKind.Term]
export const getTypes = <T extends TypeBinding>(
  bindings: Record<BindingKind.Type, T[]>,
): T[] => bindings[BindingKind.Type]
