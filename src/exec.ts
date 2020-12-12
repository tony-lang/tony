import childProcess from 'child_process'
import { Config } from './config'
import { log } from './logger'
import { AbsolutePath } from './types/paths'

export const exec = async (
  config: Config,
  file: AbsolutePath,
  args: string[] = [],
): Promise<void> => {
  log(config, 'Executing', file.path)

  return new Promise((resolve) => {
    childProcess
      .spawn('node', [file.path, ...args], { stdio: 'inherit' })
      .on('close', resolve)
  })
}
