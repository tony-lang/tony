import { AbsolutePath, buildAbsolutePath } from './types/path'
import { getOutFilename } from './util/paths'

export type Config = {
  debug: boolean
  entry: AbsolutePath
  out: AbsolutePath
  verbose: boolean
}

export type ConfigOptions = {
  debug?: boolean
  out?: string
  verbose?: boolean
}

export const buildConfig = (entry: string, options: ConfigOptions): Config => {
  const { out } = options

  return {
    debug: false,
    verbose: false,
    ...options,
    entry: buildAbsolutePath(entry),
    out: buildAbsolutePath(out || getOutFilename(entry)),
  }
}
