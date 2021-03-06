import { AbsolutePath, RelativePath } from '../path'
import { ProgramNode, SyntaxNode } from 'tree-sitter-tony/tony'
import { CyclicDependency } from '../cyclic_dependency'
import { Dependency } from '../analyze/dependencies'
import { Type } from '../type_inference/categories'
import { TypedNode } from '../type_inference/nodes'

// ---- Types ----

export enum ErrorAnnotationKind {
  CyclicDependency,
  DuplicateBinding,
  ExportOutsideFileScope,
  ImportOutsideFileScope,
  IncompleteWhenPattern,
  AmbiguousType,
  MissingBinding,
  PrimitiveTypeArguments,
  RefinementTypeDeclarationOutsideRefinementType,
  Type,
  UnknownFile,
  UnknownImport,
}

export type CyclicDependencyError = {
  readonly kind: typeof ErrorAnnotationKind.CyclicDependency
  readonly cyclicDependency: CyclicDependency<Dependency>
}

export type DuplicateBindingError = {
  readonly kind: typeof ErrorAnnotationKind.DuplicateBinding
  readonly name: string
}

export type ExportOutsideFileScopeError = {
  readonly kind: typeof ErrorAnnotationKind.ExportOutsideFileScope
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

export type ErrorAnnotation =
  | CyclicDependencyError
  | DuplicateBindingError
  | ExportOutsideFileScopeError
  | ImportOutsideFileScopeError
  | IncompleteWhenPatternError
  | AmbiguousTypeError
  | MissingBindingError
  | PrimitiveTypeArgumentsError
  | RefinementTypeDeclarationOutsideRefinementTypeError
  | TypeError
  | UnknownFileError
  | UnknownImportError

export type MountedErrorAnnotation = {
  node: SyntaxNode
  error: ErrorAnnotation
}

// ---- Factories ----

export const buildCyclicDependencyError = (
  cyclicDependency: CyclicDependency<Dependency>,
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

export const buildExportOutsideFileScopeError =
  (): ExportOutsideFileScopeError => ({
    kind: ErrorAnnotationKind.ExportOutsideFileScope,
  })

export const buildImportOutsideFileScopeError =
  (): ImportOutsideFileScopeError => ({
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

export const buildPrimitiveTypeArgumentsError =
  (): PrimitiveTypeArgumentsError => ({
    kind: ErrorAnnotationKind.PrimitiveTypeArguments,
  })

export const buildRefinementTypeDeclarationOutsideRefinementTypeError =
  (): RefinementTypeDeclarationOutsideRefinementTypeError => ({
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
