import { FileScope, NestedScope } from '../types/analyze/scopes'
import { AbsolutePath } from '../types/path'
import { Config } from '../config'
import { Dependency } from '../types/analyze/dependencies'
import { TermBinding } from '../types/analyze/bindings'

export type ImportedBindingConfig = {
  dependency: Dependency
  originalName?: string
}

export type AbstractState = {
  config: Config
  file: AbsolutePath
  /**
   * A stack of all scopes starting with the closest scope and ending with the
   * symbol table. Scopes are collected recursively.
   */
  scopes: (FileScope | NestedScope)[]
  /**
   * Buffered term-level bindings that have been defined but should not be
   * accessed yet (e.g. within patterns).
   */
  terms: TermBinding[]
  /**
   * When enabled the next declared bindings will be exported.
   */
  exportNextBindings?: boolean
  /**
   * When enabled the next declared bindings will be imported from the given
   * path.
   */
  importNextBindingsFrom?: ImportedBindingConfig
  /**
   * When enabled the next bindings stemming from identifier patterns will be
   * implicit.
   */
  nextIdentifierPatternBindingsImplicit?: boolean
  /**
   * Is set to true when the scope for the next block was already created. Then,
   * no additional scope is created when encountering the next block.
   */
  nextBlockScopeAlreadyCreated?: boolean
}
