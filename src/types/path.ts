import { join, resolve } from 'path'

// ---- Types ----

enum PathKind {
  Absolute,
  Relative,
}

export type AbsolutePath = {
  kind: typeof PathKind.Absolute
  path: string
}

export type RelativePath = {
  kind: typeof PathKind.Relative
  path: string
  mount: AbsolutePath
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
