import { Node } from '../analyze/ast'
import { Binding } from '../analyze/bindings'
import { FileScope, NestedScope } from '../analyze/scopes'
import { Answers } from '../type_inference/answers'
import { Type } from '../type_inference/types'
import { CyclicDependency, Path } from '../util'

export enum CompileErrorKind {
  CyclicDependency,
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

export interface CyclicDependencyError {
  kind: typeof CompileErrorKind.CyclicDependency
  cyclicDependency: CyclicDependency<Path>
}

export interface DuplicateBindingError<T extends Binding> {
  kind: typeof CompileErrorKind.DuplicateBinding
  binding: T
}

export interface ExportOutsideModuleScopeError {
  kind: typeof CompileErrorKind.ExportOutsideModuleScope
}

export interface ExternalTypeImportError<T extends Type> {
  kind: typeof CompileErrorKind.ExternalTypeImport
  type: T
}

export interface ImportOutsideFileScopeError {
  kind: typeof CompileErrorKind.ImportOutsideFileScope
}

export interface IndeterminateTypeError<T extends Node> {
  kind: typeof CompileErrorKind.IndeterminateType
  answers: Answers<T>
}

export interface MissingBindingError<T extends Binding> {
  kind: typeof CompileErrorKind.MissingBinding
  binding: T
  scope: FileScope | NestedScope
}

export interface MissingExternalImportTypeHintError<T extends Binding> {
  kind: typeof CompileErrorKind.MissingExternalImportTypeHint
  binding: T
}

export interface TypeError<T extends Type, U extends Type> {
  kind: typeof CompileErrorKind.Type
  expected: T
  actual: U
}

export interface UnknownImportError {
  kind: typeof CompileErrorKind.UnknownImport
  sourcePath: string
}

export interface UnsupportedSyntaxError {
  kind: typeof CompileErrorKind.UnsupportedSyntax
}

export interface UseOfTypeAsValueError<T extends Type> {
  kind: typeof CompileErrorKind.UseOfTypeAsValue
  type: T
}

export type CompileError<
  T extends Binding,
  U extends Node,
  V extends Type,
  W extends Type
> =
  | CyclicDependencyError
  | DuplicateBindingError<T>
  | ExportOutsideModuleScopeError
  | ExternalTypeImportError<V>
  | ImportOutsideFileScopeError
  | IndeterminateTypeError<U>
  | MissingBindingError<T>
  | MissingExternalImportTypeHintError<T>
  | TypeError<V, W>
  | UnknownImportError
  | UnsupportedSyntaxError
  | UseOfTypeAsValueError<V>
