import { analyze } from './analyze'
import { writeEmit } from './emit'
import { generateCode } from './code_generation'
import { inferTypes } from './type_inference'
import { ConfigOptions, buildConfig } from './config'
import { log } from './logger'

export const compile = async (
  entry: string,
  options: ConfigOptions,
): Promise<string | undefined> => {
  const config = buildConfig(entry, options)

  log(config, `Compiling ${config.entry}...`)

  const globalScope = await analyze(config)
  const typedGlobalScope = inferTypes(globalScope, config)

  if (!options.emit) return

  const emit = generateCode(typedGlobalScope, config)
  await writeEmit(emit, config)

  return config.out
}
