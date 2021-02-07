import { AbsolutePath } from './path'

// ---- Types ----

export type FileEmit = {
  readonly originalFile: AbsolutePath
  readonly content: string
}

export type Emit = FileEmit[]

// ---- Factories ----

export const buildFileEmit = (
  originalFile: AbsolutePath,
  content: string,
): FileEmit => ({ originalFile, content })
