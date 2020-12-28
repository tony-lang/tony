import { AbsolutePath } from './path'

type FileEmit = {
  originalFile: AbsolutePath
  content: string
}

export type Emit = FileEmit[]
