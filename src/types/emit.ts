import { AbsolutePath } from './path'

// ---- Types ----

export type FileEmit = {
  originalFile: AbsolutePath
  content: string
}

export type Emit = FileEmit[]

// ---- Factories ----

export const buildFileEmit = (
  originalFile: AbsolutePath,
  content: string,
): FileEmit => ({ originalFile, content })
