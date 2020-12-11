import { Config } from './config'
import { log } from './logger'
import { Emit } from './types'
import { getOutFilename, writeFile } from './util/file_system'

export const writeEmit = async (emit: Emit, config: Config): Promise<void> => {
  await Promise.all(
    emit.map(async ({ path, content }) => {
      const out = getOutFilename(path)

      log(config, 'Emitting code for', path, 'to', out)

      await writeFile(out, content)
    }),
  )
}
