import { DestructuringPattern } from './DestructuringPattern'
import { IdentifierPattern } from './IdentifierPattern'
import { LiteralPattern } from './LiteralPattern'

export type Pattern = DestructuringPattern | IdentifierPattern | LiteralPattern
