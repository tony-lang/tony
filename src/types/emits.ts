import { AbsolutePath } from './paths'

type FileEmit = {
  originalFile: AbsolutePath
  content: string
}

export type Emit = FileEmit[]
