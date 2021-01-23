import { AbsolutePath, RelativePath } from '../path'
import { ProgramNode, SyntaxNode } from 'tree-sitter-tony'
import { CyclicDependency } from '../cyclic_dependency'
import { TermBinding } from '../analyze/bindings'
import { Type } from '../type_inference/categories'
import { TypedNode } from '../type_inference/nodes'

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
  readonly kind: typeof ErrorAnnotationKind.CyclicDependency
  readonly cyclicDependency: CyclicDependency<AbsolutePath>
}

export type DuplicateBindingError = {
  readonly kind: typeof ErrorAnnotationKind.DuplicateBinding
  readonly name: string
}

export type ExportOutsideFileScopeError = {
  readonly kind: typeof ErrorAnnotationKind.ExportOutsideFileScope
}

export type ExternalTypeImportError = {
  readonly kind: typeof ErrorAnnotationKind.ExternalTypeImport
}

export type ImportOutsideFileScopeError = {
  readonly kind: typeof ErrorAnnotationKind.ImportOutsideFileScope
}

export type IncompleteWhenPatternError = {
  readonly kind: typeof ErrorAnnotationKind.IncompleteWhenPattern
  readonly missingBindings: string[]
}

export type AmbiguousTypeError = {
  readonly kind: typeof ErrorAnnotationKind.AmbiguousType
  readonly answers: TypedNode<ProgramNode>[]
}

export type MissingBindingError = {
  readonly kind: typeof ErrorAnnotationKind.MissingBinding
  readonly name: string
}

export type MissingExternalImportTypeHintError = {
  readonly kind: typeof ErrorAnnotationKind.MissingExternalImportTypeHint
  readonly binding: TermBinding
}

export type PrimitiveTypeArgumentsError = {
  readonly kind: typeof ErrorAnnotationKind.PrimitiveTypeArguments
}

export type RefinementTypeDeclarationOutsideRefinementTypeError = {
  readonly kind: typeof ErrorAnnotationKind.RefinementTypeDeclarationOutsideRefinementType
}

export type TypeError = {
  readonly kind: typeof ErrorAnnotationKind.Type
  readonly expected: Type
  readonly actual: Type
}

export type UnknownFileError = {
  readonly kind: typeof ErrorAnnotationKind.UnknownFile
  readonly sourcePath: AbsolutePath | RelativePath
}

export type UnknownImportError = {
  readonly kind: typeof ErrorAnnotationKind.UnknownImport
  readonly sourcePath: AbsolutePath
  readonly name: string
}

export type UnsupportedSyntaxError = {
  readonly kind: typeof ErrorAnnotationKind.UnsupportedSyntax
}

export type UseOfTypeAsValueError = {
  readonly kind: typeof ErrorAnnotationKind.UseOfTypeAsValue
  readonly type: Type
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
