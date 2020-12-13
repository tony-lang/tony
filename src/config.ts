import { AbsolutePath, buildAbsolutePath } from './types/paths'
import { getOutFilename } from './util/file_system'

export type Config = {
  entry: AbsolutePath
  emit: boolean
  out: AbsolutePath
  verbose: boolean
}

export type ConfigOptions = {
  emit?: boolean
  out?: string
  verbose?: boolean
}

export const buildConfig = (entry: string, options: ConfigOptions): Config => {
  const { out } = options

  return {
    emit: true,
    verbose: false,
    ...options,
    entry: buildAbsolutePath(entry),
    out: buildAbsolutePath(out || getOutFilename(entry)),
  }
}
