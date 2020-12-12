import { GlobalScope, TypedFileScope } from '../types/analyze/scopes'
import { Config } from '../config'
import { Emit } from '../types/emits'

export const generateCode = (
  config: Config,
  globalScope: GlobalScope<TypedFileScope>,
): Emit => {}
