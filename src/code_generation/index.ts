import { GlobalScope, TypedFileScope } from '../types/analyze/scopes'
import { Config } from '../config'
import { Emit } from '../types/util'

export const generateCode = (
  globalScope: GlobalScope<TypedFileScope>,
  { verbose }: Config,
): Emit => {}
