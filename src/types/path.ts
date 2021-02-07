import { join, resolve } from 'path'

// ---- Types ----

enum PathKind {
  Absolute,
  Relative,
}

export type AbsolutePath = {
  readonly kind: typeof PathKind.Absolute
  readonly path: string
}

export type RelativePath = {
  readonly kind: typeof PathKind.Relative
  readonly path: string
  readonly mount: AbsolutePath
}

export type Path = AbsolutePath | RelativePath

// ---- Factories ----

export const buildAbsolutePath = (...pathSegments: string[]): AbsolutePath => ({
  kind: PathKind.Absolute,
  path: resolve(...pathSegments),
})

export const buildRelativePath = (
  mount: AbsolutePath,
  ...pathSegments: string[]
): RelativePath => ({
  kind: PathKind.Relative,
  path: join(...pathSegments),
  mount,
})

export const buildRelativePathFromFile = (
  mount: AbsolutePath,
  ...pathSegments: string[]
): RelativePath => buildRelativePath(mount, '..', ...pathSegments)
