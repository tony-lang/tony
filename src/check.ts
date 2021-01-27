import { GlobalScope, TypedFileScope } from './types/analyze/scopes'
import { LogLevel, log } from './logger'
import { buildReport, reportHasError } from './errors'
import { Config } from './config'
import { Report } from './types/errors/reports'
import { analyze } from './analyze'
import { inferTypes } from './type_inference'

type CheckResult = GlobalScope<TypedFileScope> | Report

export const check = async (config: Config): Promise<CheckResult> => {
  log(config, LogLevel.Info, 'Checking', config.entry.path)

  const globalScope = await analyze(config)
  const typedGlobalScope = inferTypes(config, globalScope)

  const report = buildReport(typedGlobalScope)
  if (reportHasError(report)) return report

  return typedGlobalScope
}

export const checkSuccessful = (
  result: CheckResult,
): result is GlobalScope<TypedFileScope> => 'kind' in result

export const checkUnsuccessful = (result: CheckResult): result is Report =>
  !checkSuccessful(result)
