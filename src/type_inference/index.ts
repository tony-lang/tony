import { FileScope, GlobalScope, TypedFileScope } from '../types/analyze/scopes'
import { Config } from '../config'

export const inferTypes = (
  config: Config,
  globalScope: GlobalScope<FileScope>,
): GlobalScope<TypedFileScope> => {}
