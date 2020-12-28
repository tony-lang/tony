import { LogLevel, log } from './logger'
import { AbsolutePath } from './types/path'
import { Config } from './config'
import childProcess from 'child_process'

export const exec = async (
  config: Config,
  file: AbsolutePath,
  args: string[] = [],
): Promise<void> => {
  log(config, LogLevel.Info, 'Executing', file.path)

  return new Promise((resolve) => {
    childProcess
      .spawn('node', [file.path, ...args], { stdio: 'inherit' })
      .on('close', resolve)
  })
}
