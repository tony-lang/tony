import { SourceDependency } from './analyze/dependencies'
import { AbsolutePath } from './path'

// ---- Types ----

export type FileEmit = {
  readonly originalFile: SourceDependency
  readonly content: string
}

export type Emit = FileEmit[]

// ---- Factories ----

export const buildFileEmit = (
  originalFile: SourceDependency,
  content: string,
): FileEmit => ({ originalFile, content })
