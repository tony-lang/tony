import { AbsolutePath, RelativePath, buildAbsolutePath } from '../types/path'
import { fileExists, readFile } from '../util/paths'
import { Config } from '../config'
import { assert } from '../types/errors/internal'
import { isNotUndefined } from '../util'

const resolveOptions = async (
  { entry }: Config,
  { path, mount }: RelativePath,
) => {
  const packageSource = await resolvePackageSource(entry, path)
  return [
    buildAbsolutePath(mount.path, path),
    buildAbsolutePath(mount.path, path, 'index.tn'),
    buildAbsolutePath(mount.path, path, 'index.dtn'),
    buildAbsolutePath(entry.path, 'node_modules', path),
    buildAbsolutePath(entry.path, 'node_modules', path, 'index.tn'),
    buildAbsolutePath(entry.path, 'node_modules', path, 'index.dtn'),
    packageSource !== undefined
      ? buildAbsolutePath(entry.path, 'node_modules', path, packageSource)
      : undefined,
    buildAbsolutePath(entry.path, path),
    buildAbsolutePath(entry.path, path, 'index.tn'),
    buildAbsolutePath(entry.path, path, 'index.dtn'),
  ].filter(isNotUndefined)
}

const resolvePackageSource = async (entry: AbsolutePath, path: string) => {
  const packageJson = buildAbsolutePath(
    entry.path,
    'node_modules',
    path,
    'package.json',
  )
  if (!fileExists(packageJson)) return
  const packageConfig: Partial<Record<string, unknown>> = JSON.parse(
    await readFile(packageJson),
  )
  const source = packageConfig.source
  assert(
    typeof source === 'string' || source === undefined,
    `'source' entry in package.json of ${path} is expected to be a string if it exists.`,
  )
  return source
}

export const resolveRelativePath = async (
  config: Config,
  path: RelativePath,
  predicate: (file: AbsolutePath) => boolean,
): Promise<AbsolutePath | undefined> => {
  const options = await resolveOptions(config, path)
  return options.find(predicate)
}
