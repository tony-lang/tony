import {
  FileScope,
  GlobalScope,
  buildGlobalScope,
} from '../types/analyze/scopes'
import { Config } from '../config'
import { log } from '../logger'
import { fileMayBeEntry } from '../util/file_system'
import { analyzeFiles } from './explore'
import { sortFileScopes } from './sort'
import { buildUnknownEntryError } from '../types/errors/annotations'

export const analyze = async (
  config: Config,
): Promise<GlobalScope<FileScope>> => {
  log(config, 'Building symbol table')

  if (!fileMayBeEntry(config.entry))
    return buildGlobalScope([], [buildUnknownEntryError(config.entry)])

  const fileScopes = await analyzeFiles(config.entry, config)
  const { fileScopes: sortedFileScopes, error } = sortFileScopes(fileScopes, config)

  if (error === undefined) {
    log(
      config,
      'Topological sorting on files returned:',
      sortedFileScopes
        .map((fileScope) => fileScope.filePath)
        .join('>')
    )

    return buildGlobalScope(sortedFileScopes)
  } else {
    log(
      config,
      'Topological sorting failed with cyclic dependency:',
      error.cyclicDependency
    )

    return buildGlobalScope(sortedFileScopes, [error])
  }
}
