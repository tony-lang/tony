import { ListPattern } from './ListPattern'
import { MapPattern } from './MapPattern'
import { PatternPair } from './PatternPair'
import { Rest } from './Rest'
import { ShorthandPairIdentifierPattern } from './ShorthandPairIdentifierPattern'
import { TuplePattern } from './TuplePattern'

export type DestructuringPattern =
  | ListPattern
  | MapPattern
  | PatternPair
  | Rest
  | ShorthandPairIdentifierPattern
  | TuplePattern
