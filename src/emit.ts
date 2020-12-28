import { LogLevel, log } from './logger'
import { getOutFilename, writeFile } from './util/paths'
import { Config } from './config'
import { Emit } from './types/emit'
import { buildAbsolutePath } from './types/path'

export const writeEmit = async (config: Config, emit: Emit): Promise<void> => {
  await Promise.all(
    emit.map(async ({ originalFile, content }) => {
      const out = buildAbsolutePath(getOutFilename(originalFile.path))

      log(
        config,
        LogLevel.Info,
        'Emitting code for',
        originalFile.path,
        'to',
        out.path,
      )

      await writeFile(out, content)
    }),
  )
}
