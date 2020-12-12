import { ProgramNode, SyntaxNode } from 'tree-sitter-tony'
import { Binding } from '../analyze/bindings'
import { FileScope, NestedScope } from '../analyze/scopes'
import { CyclicDependency } from '../cyclic_dependencies'
import { AbsolutePath, RelativePath } from '../paths'
import { Answers } from '../type_inference/answers'
import { Type } from '../type_inference/types'

// ---- Types ----

export enum ErrorAnnotationKind {
  CyclicDependency,
  DuplicateBinding,
  ExportOutsideModuleScope,
  ExternalTypeImport,
  ImportOutsideFileScope,
  IndeterminateType,
  MissingBinding,
  MissingExternalImportTypeHint,
  Type,
  UnknownEntry,
  UnknownImport,
  UnsupportedSyntax,
  UseOfTypeAsValue,
}

export interface CyclicDependencyError {
  kind: typeof ErrorAnnotationKind.CyclicDependency
  cyclicDependency: CyclicDependency<AbsolutePath>
}

export interface DuplicateBindingError {
  kind: typeof ErrorAnnotationKind.DuplicateBinding
  name: string
}

export interface ExportOutsideModuleScopeError {
  kind: typeof ErrorAnnotationKind.ExportOutsideModuleScope
}

export interface ExternalTypeImportError {
  kind: typeof ErrorAnnotationKind.ExternalTypeImport
  type: Type
}

export interface ImportOutsideFileScopeError {
  kind: typeof ErrorAnnotationKind.ImportOutsideFileScope
}

export interface IndeterminateTypeError {
  kind: typeof ErrorAnnotationKind.IndeterminateType
  answers: Answers<ProgramNode>
}

export interface MissingBindingError {
  kind: typeof ErrorAnnotationKind.MissingBinding
  binding: Binding
  scope: FileScope | NestedScope
}

export interface MissingExternalImportTypeHintError {
  kind: typeof ErrorAnnotationKind.MissingExternalImportTypeHint
  binding: Binding
}

export interface TypeError {
  kind: typeof ErrorAnnotationKind.Type
  expected: Type
  actual: Type
}

export interface UnknownEntryError {
  kind: typeof ErrorAnnotationKind.UnknownEntry
  sourcePath: AbsolutePath
}

export interface UnknownImportError {
  kind: typeof ErrorAnnotationKind.UnknownImport
  sourcePath: RelativePath
}

export interface UnsupportedSyntaxError {
  kind: typeof ErrorAnnotationKind.UnsupportedSyntax
}

export interface UseOfTypeAsValueError {
  kind: typeof ErrorAnnotationKind.UseOfTypeAsValue
  type: Type
}

export type ErrorAnnotation =
  | CyclicDependencyError
  | DuplicateBindingError
  | ExportOutsideModuleScopeError
  | ExternalTypeImportError
  | ImportOutsideFileScopeError
  | IndeterminateTypeError
  | MissingBindingError
  | MissingExternalImportTypeHintError
  | TypeError
  | UnknownEntryError
  | UnknownImportError
  | UnsupportedSyntaxError
  | UseOfTypeAsValueError

export type MountedErrorAnnotation = {
  node: SyntaxNode
  error: ErrorAnnotation
}

// ---- Factories ----

export const buildCyclicDependencyError = (
  cyclicDependency: CyclicDependency<AbsolutePath>,
): CyclicDependencyError => ({
  kind: ErrorAnnotationKind.CyclicDependency,
  cyclicDependency,
})

export const buildDuplicateBindingError = (
  name: string,
): DuplicateBindingError => ({
  kind: ErrorAnnotationKind.DuplicateBinding,
  name,
})

export const buildExportOutsideModuleScopeError = (): ExportOutsideModuleScopeError => ({
  kind: ErrorAnnotationKind.ExportOutsideModuleScope,
})

export const buildImportOutsideFileScopeError = (): ImportOutsideFileScopeError => ({
  kind: ErrorAnnotationKind.ImportOutsideFileScope,
})

export const buildUnknownEntryError = (
  sourcePath: AbsolutePath,
): UnknownEntryError => ({
  kind: ErrorAnnotationKind.UnknownEntry,
  sourcePath,
})

export const buildUnknownImportError = (
  sourcePath: RelativePath,
): UnknownImportError => ({
  kind: ErrorAnnotationKind.UnknownImport,
  sourcePath,
})
