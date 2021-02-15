import { isDeclarationFile, isSourceFile } from '../../util/paths'
import { AbsolutePath } from '../path'
import { assert } from '../errors/internal'

// ---- Types ----

export enum DependencyKind {
  Declaration,
  Source,
}

type AbstractDependency = {
  readonly file: AbsolutePath
}

export type DeclarationDependency = AbstractDependency & {
  readonly kind: typeof DependencyKind.Declaration
}

export type SourceDependency = AbstractDependency & {
  readonly kind: typeof DependencyKind.Source
}

export type Dependency = DeclarationDependency | SourceDependency

// ---- Factories ----

export const buildDependency = (file: AbsolutePath): Dependency => {
  if (isSourceFile(file)) return buildSourceDependency(file)
  if (isDeclarationFile(file)) return buildDeclarationDependency(file)
  assert(false, 'Cannot build dependency of file that cannot be imported.')
}

export const buildDeclarationDependency = (
  file: AbsolutePath,
): DeclarationDependency => {
  assert(
    isDeclarationFile(file),
    'Declaration dependencies must be declaration files.',
  )
  return {
    kind: DependencyKind.Declaration,
    file,
  }
}

export const buildSourceDependency = (file: AbsolutePath): SourceDependency => {
  assert(isSourceFile(file), 'Source dependencies must be source files.')
  return {
    kind: DependencyKind.Source,
    file,
  }
}

export const isDeclarationDependency = (
  dependency: Dependency,
): dependency is DeclarationDependency =>
  dependency.kind === DependencyKind.Declaration

export const isSourceDependency = (
  dependency: Dependency,
): dependency is SourceDependency => dependency.kind === DependencyKind.Source
