import {
  FileScope,
  GlobalScope,
  buildGlobalScope,
} from '../types/analyze/scopes'
import { LogLevel, log } from '../logger'
import { Config } from '../config'
import { analyzeFiles } from './explore'
import { buildUnknownFileError } from '../types/errors/annotations'
import { fileMayBeEntry } from '../util/paths'
import { sortFileScopes } from './sort'

export const analyze = async (
  config: Config,
): Promise<GlobalScope<FileScope>> => {
  log(config, LogLevel.Info, 'Building symbol table')

  if (!fileMayBeEntry(config.entry))
    return buildGlobalScope([], [buildUnknownFileError(config.entry)])

  const fileScopes = await analyzeFiles(config)
  return sortFileScopes(config, fileScopes)
}
