import { GlobalScope, TypedFileScope } from './types/analyze/scopes'
import { LogLevel, log } from './logger'
import { Config } from './config'
import { analyze } from './analyze'
import { inferTypes } from './type_inference'

/**
 * Runs analysis and type inference to return a typed global scope.
 */
export const check = async (
  config: Config,
): Promise<GlobalScope<TypedFileScope>> => {
  log(config, LogLevel.Info, 'Checking', config.entry.path)

  const globalScope = await analyze(config)
  return inferTypes(config, globalScope)
}
