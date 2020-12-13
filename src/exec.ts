import { AbsolutePath } from './types/paths'
import { Config } from './config'
import childProcess from 'child_process'
import { log } from './logger'

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
