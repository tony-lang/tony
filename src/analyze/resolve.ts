import { Config } from '../config'
import { buildAbsolutePath, RelativePath } from '../types/paths'
import { fileMayBeImported } from '../util/file_system'

const resolveOptions = ({ entry }: Config, { path, mount }: RelativePath) => [
  buildAbsolutePath(mount.path, path),
  buildAbsolutePath(entry.path, 'node_modules', path),
  buildAbsolutePath(entry.path, path),
]

export const resolveRelativePath = (config: Config, path: RelativePath) =>
  resolveOptions(config, path).find(fileMayBeImported)
