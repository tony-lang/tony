import {
  FileScope,
  NestedScope,
  NestingTermLevelNode,
} from '../types/analyze/scopes'
import { Dependency } from '../types/analyze/dependencies'

export type State<T extends Dependency = Dependency> = {
  /**
   * A stack of all scopes starting with the closest scope and ending with the
   * symbol table.
   */
  scopes: (
    | FileScope<T, NestingTermLevelNode>
    | NestedScope<NestingTermLevelNode>
  )[]
}
