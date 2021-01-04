import { AbsolutePath, RelativePath } from '../path'
import { ProgramNode, SyntaxNode } from 'tree-sitter-tony'
import { CyclicDependency } from '../cyclic_dependency'
import { ResolvedConstrainedType } from '../type_inference/constraints'
import { TermBinding } from '../analyze/bindings'
import { Type } from '../type_inference/types'
import { TypedNode } from '../type_inference/nodes'
import { flattenConstrainedType } from '../../type_inference/constraints'

// ---- Types ----

export enum ErrorAnnotationKind {
  CyclicDependency,
  DuplicateBinding,
  ExportOutsideFileScope,
  ExternalTypeImport,
  ImportOutsideFileScope,
  IncompleteWhenPattern,
  IndeterminateType,
  MissingBinding,
  MissingExternalImportTypeHint,
  RefinementTypeDeclarationOutsideRefinementType,
  Type,
  UnknownFile,
  UnknownImport,
  UnsupportedSyntax,
  UseOfTypeAsValue,
}

export type CyclicDependencyError = {
  kind: typeof ErrorAnnotationKind.CyclicDependency
  cyclicDependency: CyclicDependency<AbsolutePath>
}

export type DuplicateBindingError = {
  kind: typeof ErrorAnnotationKind.DuplicateBinding
  name: string
}

export type ExportOutsideFileScopeError = {
  kind: typeof ErrorAnnotationKind.ExportOutsideFileScope
}

export type ExternalTypeImportError = {
  kind: typeof ErrorAnnotationKind.ExternalTypeImport
  type: Type
}

export type ImportOutsideFileScopeError = {
  kind: typeof ErrorAnnotationKind.ImportOutsideFileScope
}

export type IncompleteWhenPatternError = {
  kind: typeof ErrorAnnotationKind.IncompleteWhenPattern
  missingBindings: string[]
}

export type IndeterminateTypeError = {
  kind: typeof ErrorAnnotationKind.IndeterminateType
  answers: TypedNode<ProgramNode>[]
}

export type MissingBindingError = {
  kind: typeof ErrorAnnotationKind.MissingBinding
  name: string
}

export type MissingExternalImportTypeHintError = {
  kind: typeof ErrorAnnotationKind.MissingExternalImportTypeHint
  binding: TermBinding
}

export type RefinementTypeDeclarationOutsideRefinementTypeError = {
  kind: typeof ErrorAnnotationKind.RefinementTypeDeclarationOutsideRefinementType
}

export type TypeError = {
  kind: typeof ErrorAnnotationKind.Type
  expected: Type
  actual: Type
}

export type UnknownFileError = {
  kind: typeof ErrorAnnotationKind.UnknownFile
  sourcePath: AbsolutePath | RelativePath
}

export type UnknownImportError = {
  kind: typeof ErrorAnnotationKind.UnknownImport
  sourcePath: AbsolutePath
  name: string
}

export type UnsupportedSyntaxError = {
  kind: typeof ErrorAnnotationKind.UnsupportedSyntax
}

export type UseOfTypeAsValueError = {
  kind: typeof ErrorAnnotationKind.UseOfTypeAsValue
  type: Type
}

export type ErrorAnnotation =
  | CyclicDependencyError
  | DuplicateBindingError
  | ExportOutsideFileScopeError
  | ExternalTypeImportError
  | ImportOutsideFileScopeError
  | IncompleteWhenPatternError
  | IndeterminateTypeError
  | MissingBindingError
  | MissingExternalImportTypeHintError
  | RefinementTypeDeclarationOutsideRefinementTypeError
  | TypeError
  | UnknownFileError
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

export const buildExportOutsideFileScopeError = (): ExportOutsideFileScopeError => ({
  kind: ErrorAnnotationKind.ExportOutsideFileScope,
})

export const buildImportOutsideFileScopeError = (): ImportOutsideFileScopeError => ({
  kind: ErrorAnnotationKind.ImportOutsideFileScope,
})

export const buildIncompleteWhenPatternError = (
  missingBindings: string[],
): IncompleteWhenPatternError => ({
  kind: ErrorAnnotationKind.IncompleteWhenPattern,
  missingBindings,
})

export const buildIndeterminateTypeError = (
  answers: TypedNode<ProgramNode>[],
): IndeterminateTypeError => ({
  kind: ErrorAnnotationKind.IndeterminateType,
  answers,
})

export const buildMissingBindingError = (
  name: string,
): MissingBindingError => ({
  kind: ErrorAnnotationKind.MissingBinding,
  name,
})

export const buildRefinementTypeDeclarationOutsideRefinementTypeError = (): RefinementTypeDeclarationOutsideRefinementTypeError => ({
  kind: ErrorAnnotationKind.RefinementTypeDeclarationOutsideRefinementType,
})

export const buildTypeError = (expected: Type, actual: Type): TypeError => ({
  kind: ErrorAnnotationKind.Type,
  expected,
  actual,
})

export const buildTypeErrorFromConstrainedType = (
  expected: ResolvedConstrainedType,
  actual: ResolvedConstrainedType,
): TypeError => ({
  kind: ErrorAnnotationKind.Type,
  expected: flattenConstrainedType(expected),
  actual: flattenConstrainedType(actual),
})

export const buildUnknownFileError = (
  sourcePath: AbsolutePath | RelativePath,
): UnknownFileError => ({
  kind: ErrorAnnotationKind.UnknownFile,
  sourcePath,
})

export const buildUnknownImportError = (
  sourcePath: AbsolutePath,
  name: string,
): UnknownImportError => ({
  kind: ErrorAnnotationKind.UnknownImport,
  sourcePath,
  name,
})
