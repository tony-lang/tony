import { InternalError } from './errors'
import childProcess from 'child_process'
import path from 'path'

export const compile = (
  filePath: string,
  mode: string,
  verbose: boolean,
): Promise<void> => {
  if (verbose) console.log('Compiling with Webpack...')

  return new Promise((resolve) => {
    childProcess
      .spawn(
        path.join(__dirname, '..', '..', 'node_modules', '.bin', 'webpack-cli'),
        [filePath, '-o', filePath, '--mode', mode],
        { stdio: verbose ? 'inherit' : undefined },
      )
      .on('close', resolve)
      .on('error', (error) => {
        throw new InternalError(
          'Webpack compilation failed unexpectedly.',
          error.message,
        )
      })
  })
}
