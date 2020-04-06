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
    let output = ''

    const child = childProcess.spawn(
      path.join(__dirname, '..', '..', 'node_modules', '.bin', 'webpack-cli'),
      [filePath, '-o', filePath, '--mode', mode],
      { stdio: verbose ? 'inherit' : undefined },
    )
    if (child.stdout)
      child.stdout.on('data', (data) => (output += data.toString()))
    child.on('close', (code) => (code ? handleError(output) : resolve()))
  })
}

const handleError = (output: string): void => {
  throw new InternalError(
    `${output}\n\nWebpack compilation failed unexpectedly.`,
  )
}
