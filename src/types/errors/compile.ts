import { Program } from '../analyze/ast'
import { Binding } from '../analyze/bindings'
import { FileScope, NestedScope } from '../analyze/scopes'
import { Answers } from '../type_inference/answers'
import { Type } from '../type_inference/types'
import { CyclicDependency, Path } from '..'

enum CompileErrorKind {
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

export interface DuplicateBindingError {
  kind: typeof CompileErrorKind.DuplicateBinding
  binding: Binding
}

export interface ExportOutsideModuleScopeError {
  kind: typeof CompileErrorKind.ExportOutsideModuleScope
}

export interface ExternalTypeImportError {
  kind: typeof CompileErrorKind.ExternalTypeImport
  type: Type
}

export interface ImportOutsideFileScopeError {
  kind: typeof CompileErrorKind.ImportOutsideFileScope
}

export interface IndeterminateTypeError {
  kind: typeof CompileErrorKind.IndeterminateType
  answers: Answers<Program>
}

export interface MissingBindingError {
  kind: typeof CompileErrorKind.MissingBinding
  binding: Binding
  scope: FileScope | NestedScope
}

export interface MissingExternalImportTypeHintError {
  kind: typeof CompileErrorKind.MissingExternalImportTypeHint
  binding: Binding
}

export interface TypeError {
  kind: typeof CompileErrorKind.Type
  expected: Type
  actual: Type
}

export interface UnknownImportError {
  kind: typeof CompileErrorKind.UnknownImport
  sourcePath: string
}

export interface UnsupportedSyntaxError {
  kind: typeof CompileErrorKind.UnsupportedSyntax
}

export interface UseOfTypeAsValueError {
  kind: typeof CompileErrorKind.UseOfTypeAsValue
  type: Type
}

export type CompileError =
  | CyclicDependencyError
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

export class UnknownEntryError extends Error {
  private _sourcePath: string

  constructor(sourcePath: string) {
    super()
    this.name = this.constructor.name

    this._sourcePath = sourcePath
  }

  get sourcePath(): string {
    return this._sourcePath
  }
}
