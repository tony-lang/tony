import { ErrorAnnotation, MountedErrorAnnotation } from './annotations'
import { AbsolutePath } from '../path'

export type Report = {
  errors: ErrorAnnotation[]
  mountedErrors: [file: AbsolutePath, errors: MountedErrorAnnotation[]][]
}
