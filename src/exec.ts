import childProcess from 'child_process'

import { getFilePath } from './utilities'

export const exec = async (
  file: string,
  args: string[] = [],
  { verbose = false }
): Promise<void> => {
  const filePath = getFilePath(file)
  if (verbose) console.log(`Executing ${filePath}...`)

  return new Promise(resolve => {
    childProcess
      .spawn('node', [filePath, ...args], { stdio: 'inherit' })
      .on('close', resolve)
  })
}
