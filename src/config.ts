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

/**
 * Constructs a config from a path to the entry file and some config options.
 */
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
