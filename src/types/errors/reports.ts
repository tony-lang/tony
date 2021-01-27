import { ErrorAnnotation, MountedErrorAnnotation } from './annotations'
import { AbsolutePath } from '../path'

type FileReport = {
  readonly file: AbsolutePath
  readonly errors: MountedErrorAnnotation[]
}

export type Report = {
  readonly errors: ErrorAnnotation[]
  readonly mountedErrors: FileReport[]
}
