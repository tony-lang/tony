import { Config } from '../config'
import { AbsolutePath, RelativePath, buildAbsolutePath } from '../types/paths'

const resolveOptions = ({ entry }: Config, { path, mount }: RelativePath) => [
  buildAbsolutePath(mount.path, path),
  buildAbsolutePath(entry.path, 'node_modules', path),
  buildAbsolutePath(entry.path, path),
]

export const resolveRelativePath = (
  config: Config,
  path: RelativePath,
  predicate: (file: AbsolutePath) => boolean,
) => resolveOptions(config, path).find(predicate)
