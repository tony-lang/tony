import { ConfigOptions, buildConfig } from './config'
import { AbsolutePath } from './types/paths'
import { analyze } from './analyze'
import { generateCode } from './code_generation'
import { inferTypes } from './type_inference'
import { log } from './logger'
import { writeEmit } from './emit'

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
