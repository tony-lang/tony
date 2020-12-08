import { Path } from './types/util'
import { getFilePath, getOutFile } from './util'

export type Config = ConfigOptions & InternalConfig

export type ConfigOptions = {
  emit?: boolean
  out?: string
  verbose?: boolean
}

type InternalConfig = {
  entry: Path
  emit: boolean
  out: Path
  verbose: boolean
}

export const buildConfig = (entry: string, options: ConfigOptions): Config => {
  const { out } = options

  return {
    emit: true,
    verbose: false,
    ...options,
    entry: getFilePath(entry),
    out: getFilePath(out || getOutFile(entry)),
  }
}
