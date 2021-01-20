import { AbsolutePath, RelativePath } from '../path'
import { ProgramNode, SyntaxNode } from 'tree-sitter-tony'
import { ResolvedType, Type } from '../type_inference/categories'
import { CyclicDependency } from '../cyclic_dependency'
import { TermBinding } from '../analyze/bindings'
import { TypeConstraints } from '../type_inference/constraints'
import { TypedNode } from '../type_inference/nodes'
import { applyConstraints } from '../../type_inference/constraints'

// ---- Types ----

export enum ErrorAnnotationKind {
  CyclicDependency,
  DuplicateBinding,
  ExportOutsideFileScope,
  ExternalTypeImport,
  ImportOutsideFileScope,
  IncompleteWhenPattern,
  AmbiguousType,
  MissingBinding,
  MissingExternalImportTypeHint,
  PrimitiveTypeArguments,
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
}

export type ImportOutsideFileScopeError = {
  kind: typeof ErrorAnnotationKind.ImportOutsideFileScope
}

export type IncompleteWhenPatternError = {
  kind: typeof ErrorAnnotationKind.IncompleteWhenPattern
  missingBindings: string[]
}

export type AmbiguousTypeError = {
  kind: typeof ErrorAnnotationKind.AmbiguousType
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

export type PrimitiveTypeArgumentsError = {
  kind: typeof ErrorAnnotationKind.PrimitiveTypeArguments
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
  | AmbiguousTypeError
  | MissingBindingError
  | MissingExternalImportTypeHintError
  | PrimitiveTypeArgumentsError
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

export const buildExternalTypeImportError = (): ExternalTypeImportError => ({
  kind: ErrorAnnotationKind.ExternalTypeImport,
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

export const buildAmbiguousTypeError = (
  answers: TypedNode<ProgramNode>[],
): AmbiguousTypeError => ({
  kind: ErrorAnnotationKind.AmbiguousType,
  answers,
})

export const buildMissingBindingError = (
  name: string,
): MissingBindingError => ({
  kind: ErrorAnnotationKind.MissingBinding,
  name,
})

export const buildPrimitiveTypeArgumentsError = (): PrimitiveTypeArgumentsError => ({
  kind: ErrorAnnotationKind.PrimitiveTypeArguments,
})

export const buildRefinementTypeDeclarationOutsideRefinementTypeError = (): RefinementTypeDeclarationOutsideRefinementTypeError => ({
  kind: ErrorAnnotationKind.RefinementTypeDeclarationOutsideRefinementType,
})

export const buildTypeError = (expected: Type, actual: Type): TypeError => ({
  kind: ErrorAnnotationKind.Type,
  expected,
  actual,
})

export const buildTypeErrorFromConstrainedTypes = (
  expected: ResolvedType,
  actual: ResolvedType,
  constraints: TypeConstraints,
): TypeError => ({
  kind: ErrorAnnotationKind.Type,
  expected: applyConstraints(expected, constraints),
  actual: applyConstraints(actual, constraints),
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
