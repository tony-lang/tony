import { GlobalScope, TypedFileScope } from '../types/analyze/scopes'
import { Config } from '../config'
import { Emit } from '../types/emits'
import { LogLevel, log } from '../logger'

export const generateCode = (
  config: Config,
  globalScope: GlobalScope<TypedFileScope>,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
): Emit => {
  log(config, LogLevel.Info, 'Generating code')

  console.log(globalScope)
}
