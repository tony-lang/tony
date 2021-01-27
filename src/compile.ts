import { ConfigOptions, buildConfig } from './config'
import { LogLevel, log } from './logger'
import { buildReport, reportHasError } from './errors'
import { AbsolutePath } from './types/path'
import { Report } from './types/errors/reports'
import { analyze } from './analyze'
import { generateCode } from './code_generation'
import { inferTypes } from './type_inference'
import { writeEmit } from './emit'

export const compile = async (
  entry: string,
  options: ConfigOptions,
): Promise<AbsolutePath | Report> => {
  const config = buildConfig(entry, options)

  log(config, LogLevel.Info, 'Compiling', config.entry.path)

  const globalScope = await analyze(config)
  const typedGlobalScope = inferTypes(config, globalScope)

  const report = buildReport(typedGlobalScope)
  if (reportHasError(report)) return Promise.reject<Report>(report)

  const emit = generateCode(config, typedGlobalScope)
  await writeEmit(config, emit)

  return config.out
}
