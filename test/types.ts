export type TestCase = {
  name: string
  error?: ExpectedError
  runtimeError?: string
  emit?: string
  output?: string
  files: File[]
}

export type ExpectedError = {
  file: string
  line: number
  pos: number
  code: string
}

export type File = {
  path: string
  content?: string
}

export enum Command {
  Error = '@error',
  RuntimeError = '@runtime-error',
  Emit = '@emit',
  Output = '@output',
  File = '@file',
}
