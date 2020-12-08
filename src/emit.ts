import { Config } from './config'
import { log } from './logger'
import { Emit } from './types/util'
import { getOutFile, writeFile } from './util'

export const writeEmit = async (emit: Emit, config: Config): Promise<void> => {
  await Promise.all(
    emit.map(async ({ path, content }) => {
      const out = getOutFile(path)

      log(`Emitting code for ${path} to ${out}...`, config)

      await writeFile(out, content)
    }),
  )
}
