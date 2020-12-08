import { FileScope, GlobalScope } from '../types/analyze/scopes'
import { Config } from '../config'
import { Path } from '../types/util'

export const analyze = (
  entry: Path,
  { verbose }: Config,
): Promise<GlobalScope<FileScope>> => {}
