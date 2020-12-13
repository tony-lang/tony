import { ConfigOptions, buildConfig } from './config'
import { AbsolutePath } from './types/paths'
import { analyze } from './analyze'
import { generateCode } from './code_generation'
import { inferTypes } from './type_inference'
import { LogLevel, log } from './logger'
import { writeEmit } from './emit'

export const compile = async (
  entry: string,
  options: ConfigOptions,
): Promise<AbsolutePath> => {
  const config = buildConfig(entry, options)

  log(config, LogLevel.Info, 'Compiling', config.entry.path)

  const globalScope = await analyze(config)
  const typedGlobalScope = inferTypes(config, globalScope)

  const emit = generateCode(config, typedGlobalScope)
  await writeEmit(config, emit)

  return config.out
}
