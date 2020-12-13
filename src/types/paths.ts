import path from 'path'

// ---- Types ----

enum PathKind {
  Absolute,
  Relative,
}

export interface AbsolutePath {
  kind: typeof PathKind.Absolute
  path: string
}

export interface RelativePath {
  kind: typeof PathKind.Relative
  path: string
  mount: AbsolutePath
}

export type Path = AbsolutePath | RelativePath

// ---- Factories ----

export const buildAbsolutePath = (...pathSegments: string[]): AbsolutePath => ({
  kind: PathKind.Absolute,
  path: path.resolve(...pathSegments),
})

export const buildRelativePath = (
  mount: AbsolutePath,
  ...pathSegments: string[]
): RelativePath => ({
  kind: PathKind.Relative,
  path: path.join(...pathSegments),
  mount,
})

export const buildRelativePathFromFile = (
  mount: AbsolutePath,
  ...pathSegments: string[]
): RelativePath => buildRelativePath(mount, '..', ...pathSegments)
