import { Program } from '../analyze/ast'
import { Binding } from '../analyze/bindings'
import { FileScope, NestedScope } from '../analyze/scopes'
import { Answers } from '../type_inference/answers'
import { Type } from '../type_inference/types'

enum ErrorAnnotationKind {
  DuplicateBinding,
  ExportOutsideModuleScope,
  ExternalTypeImport,
  ImportOutsideFileScope,
  IndeterminateType,
  MissingBinding,
  MissingExternalImportTypeHint,
  Type,
  UnknownImport,
  UnsupportedSyntax,
  UseOfTypeAsValue,
}

export interface DuplicateBindingError {
  kind: typeof ErrorAnnotationKind.DuplicateBinding
  binding: Binding
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
  answers: Answers<Program>
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

export interface UnknownImportError {
  kind: typeof ErrorAnnotationKind.UnknownImport
  sourcePath: string
}

export interface UnsupportedSyntaxError {
  kind: typeof ErrorAnnotationKind.UnsupportedSyntax
}

export interface UseOfTypeAsValueError {
  kind: typeof ErrorAnnotationKind.UseOfTypeAsValue
  type: Type
}

export type ErrorAnnotation =
  | DuplicateBindingError
  | ExportOutsideModuleScopeError
  | ExternalTypeImportError
  | ImportOutsideFileScopeError
  | IndeterminateTypeError
  | MissingBindingError
  | MissingExternalImportTypeHintError
  | TypeError
  | UnknownImportError
  | UnsupportedSyntaxError
  | UseOfTypeAsValueError
