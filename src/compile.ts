import { LogLevel, log } from './logger'
import { buildReport, reportHasError } from './errors'
import { AbsolutePath } from './types/path'
import { Config } from './config'
import { Report } from './types/errors/reports'
import { check } from './check'
import { generateCode } from './code_generation'
import { writeEmit } from './emit'

/**
 * Analyzes code. If analysis finds errors, returns a report. Otherwise,
 * generates and emits code.
 */
export const compile = async (
  config: Config,
): Promise<{ out: AbsolutePath } | Report> => {
  log(config, LogLevel.Info, 'Compiling', config.entry.path)

  const typedGlobalScope = await check(config)

  const report = buildReport(typedGlobalScope)
  if (reportHasError(report)) return report

  const emit = generateCode(config, typedGlobalScope)
  await writeEmit(config, emit)

  return { out: config.out }
}
