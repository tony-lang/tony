import {
  DeclarationFileScope,
  NestedScope,
  NestingTermLevelNode,
  SourceFileScope,
} from '../types/analyze/scopes'

export type State = {
  /**
   * A stack of all scopes starting with the closest scope and ending with the
   * symbol table.
   */
  scopes: (
    | SourceFileScope<NestingTermLevelNode>
    | NestedScope<NestingTermLevelNode>
  )[]
  /**
   * The list of all declaration file scopes.
   */
  declarationScopes: DeclarationFileScope[]
}
