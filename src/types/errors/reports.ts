import { ErrorAnnotation, MountedErrorAnnotation } from './annotations'
import { AbsolutePath } from '../path'

export type Report = {
  readonly errors: ErrorAnnotation[]
  readonly mountedErrors: [file: AbsolutePath, errors: MountedErrorAnnotation[]][]
}
