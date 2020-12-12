import { analyze } from './analyze'
import { writeEmit } from './emit'
import { generateCode } from './code_generation'
import { inferTypes } from './type_inference'
import { ConfigOptions, buildConfig } from './config'
import { log } from './logger'
import { AbsolutePath } from './types/paths'

export const compile = async (
  entry: string,
  options: ConfigOptions,
): Promise<AbsolutePath | undefined> => {
  const config = buildConfig(entry, options)

  log(config, 'Compiling', config.entry)

  const globalScope = await analyze(config)
  const typedGlobalScope = inferTypes(config, globalScope)

  if (!options.emit) return

  const emit = generateCode(config, typedGlobalScope)
  await writeEmit(config, emit)

  return config.out
}
