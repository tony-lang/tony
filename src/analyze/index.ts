import {
  FileScope,
  GlobalScope,
  buildGlobalScope,
} from '../types/analyze/scopes'
import { Config } from '../config'
import { analyzeFiles } from './explore'
import { buildUnknownEntryError } from '../types/errors/annotations'
import { fileMayBeEntry } from '../util/paths'
import { isNotUndefined } from '../util'
import { log } from '../logger'
import { sortFileScopes } from './sort'

export const analyze = async (
  config: Config,
): Promise<GlobalScope<FileScope>> => {
  log(config, 'Building symbol table')

  if (!fileMayBeEntry(config.entry))
    return buildGlobalScope([], [buildUnknownEntryError(config.entry)])

  const fileScopes = await analyzeFiles(config)
  const { fileScopes: sortedFileScopes, error } = sortFileScopes(
    config,
    fileScopes,
  )

  if (error === undefined) {
    log(
      config,
      'Topological sorting on files returned:',
      sortedFileScopes.map((fileScope) => fileScope.file.path).join('>'),
    )
  } else {
    log(
      config,
      'Topological sorting failed with cyclic dependency:',
      error.cyclicDependency,
    )
  }

  return buildGlobalScope(sortedFileScopes, [error].filter(isNotUndefined))
}
