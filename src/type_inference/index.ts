import { FileScope, GlobalScope, TypedFileScope } from '../types/analyze/scopes'
import { Config } from '../config'
import { log } from '../logger'

export const inferTypes = (
  config: Config,
  globalScope: GlobalScope<FileScope>,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
): GlobalScope<TypedFileScope> => {
  log(config, 'Running type inference')

  console.log(globalScope)
}
