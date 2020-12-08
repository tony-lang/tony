import {
  buildGlobalScope,
  FileScope,
  GlobalScope,
} from '../types/analyze/scopes'
import { Config } from '../config'
import { log } from '../logger'
import { UnknownEntryError } from '../types/errors/compile'
import { fileMayBeImported } from '../util/file_system'
import { analyzeFiles } from './explore'
import { sortFileScopes } from './sort'

export const analyze = async (
  config: Config,
): Promise<GlobalScope<FileScope>> => {
  log('Building symbol table...', config)

  if (!fileMayBeImported(config.entry))
    throw new UnknownEntryError(config.entry)

  const fileScopes = await analyzeFiles(config.entry)
  const sortedFileScopes = sortFileScopes(fileScopes)

  return buildGlobalScope(sortedFileScopes)
}
