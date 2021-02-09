import {
  FileScope,
  NestedScope,
  NestingTermLevelNode,
} from '../types/analyze/scopes'

export type State = {
  /**
   * A stack of all scopes starting with the closest scope and ending with the
   * symbol table.
   */
  scopes: (
    | FileScope<NestingTermLevelNode>
    | NestedScope<NestingTermLevelNode>
  )[]
}
