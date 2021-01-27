import { ConfigOptions, buildConfig } from './config'
import { LogLevel, log } from './logger'
import { check, checkSuccessful } from './check'
import { AbsolutePath } from './types/path'
import { Report } from './types/errors/reports'
import { generateCode } from './code_generation'
import { writeEmit } from './emit'

export const compile = async (
  entry: string,
  options: ConfigOptions,
): Promise<{ out: AbsolutePath } | Report> => {
  const config = buildConfig(entry, options)

  log(config, LogLevel.Info, 'Compiling', config.entry.path)

  const checkResult = await check(config)
  if (!checkSuccessful(checkResult)) return checkResult

  const emit = generateCode(config, checkResult)
  await writeEmit(config, emit)

  return { out: config.out }
}
