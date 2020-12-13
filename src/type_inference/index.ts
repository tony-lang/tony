import { FileScope, GlobalScope, TypedFileScope } from '../types/analyze/scopes'
import { Config } from '../config'
import { log } from '../logger'

export const inferTypes = (
  config: Config,
  globalScope: GlobalScope<FileScope>,
): GlobalScope<TypedFileScope> => {
  log(config, 'Running type inference')

  console.log(globalScope)
}
