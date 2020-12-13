import { AbsolutePath, buildAbsolutePath } from './types/paths'
import { getOutFilename } from './util/paths'

export type Config = {
  entry: AbsolutePath
  out: AbsolutePath
  verbose: boolean
}

export type ConfigOptions = {
  out?: string
  verbose?: boolean
}

export const buildConfig = (entry: string, options: ConfigOptions): Config => {
  const { out } = options

  return {
    verbose: false,
    ...options,
    entry: buildAbsolutePath(entry),
    out: buildAbsolutePath(out || getOutFilename(entry)),
  }
}
