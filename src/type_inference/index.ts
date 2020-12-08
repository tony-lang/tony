import { FileScope, GlobalScope, TypedFileScope } from '../types/analyze/scopes'
import { Config } from '../config'

export const inferTypes = (
  globalScope: GlobalScope<FileScope>,
  { verbose }: Config,
): GlobalScope<TypedFileScope> => {}
