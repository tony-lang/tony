import childProcess from 'child_process'

import Tony from './Tony'

export const exec = (
  tony: Tony,
  filePath: string,
  args: string[] = []
): Promise<number> => {
  return new Promise(resolve => {
    if (tony.debug) console.log('Executing...')

    childProcess
      .spawn('node', [filePath, ...args], { stdio: 'inherit' })
      .on('close', resolve)
  })
}
