import { FileScope, GlobalScope } from '../types/analyze/scopes'
import { Config } from '../config'
import { log } from '../logger'
import { UnknownEntryError } from '../types/errors/compile'
import { fileMayBeImported } from '../util/file_system'

export const analyze = async (
  config: Config,
): Promise<GlobalScope<FileScope>> => {
  log('Building symbol table...', config)

  if (!fileMayBeImported(config.entry))
    throw new UnknownEntryError(config.entry)
}
