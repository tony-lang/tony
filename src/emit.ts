import { getOutFilename, writeFile } from './util/file_system'
import { Config } from './config'
import { Emit } from './types/emits'
import { buildAbsolutePath } from './types/paths'
import { log } from './logger'

export const writeEmit = async (config: Config, emit: Emit): Promise<void> => {
  await Promise.all(
    emit.map(async ({ originalFile, content }) => {
      const out = buildAbsolutePath(getOutFilename(originalFile.path))

      log(config, 'Emitting code for', originalFile.path, 'to', out.path)

      await writeFile(out, content)
    }),
  )
}
