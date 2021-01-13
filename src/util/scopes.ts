import {
  FileScope,
  NestedScope,
  ScopeWithErrors,
  ScopeWithTerms,
  ScopeWithTypes,
  TypingEnvironment,
} from '../types/analyze/scopes'
import {
  TermBinding,
  TypeAssignment,
  TypeBinding,
  TypeVariableBinding,
} from '../types/analyze/bindings'
import { AbsolutePath } from '../types/path'
import { ErrorAnnotation } from '../types/errors/annotations'
import { SyntaxNode } from 'tree-sitter-tony'
import { isSamePath } from './paths'

export const findFileScope = <T extends FileScope>(
  fileScopes: T[],
  file: AbsolutePath,
): T | undefined =>
  fileScopes.find((fileScope) => isSamePath(fileScope.file, file))

export const addErrorToScope = <T extends ScopeWithErrors>(
  scope: T,
  node: SyntaxNode,
  error: ErrorAnnotation,
): T => ({
  ...scope,
  errors: [...scope.errors, { node, error }],
})

export const getTerms = (scope: ScopeWithTerms): TermBinding[] => scope.terms
export const getTypes = (scope: ScopeWithTypes): TypeBinding[] => scope.types
export const getTypeVariables = (
  scope: ScopeWithTypes,
): TypeVariableBinding[] => scope.typeVariables
export const getTypeAssignments = (
  scope: TypingEnvironment,
): TypeAssignment[] => scope.typeAssignments

export const findScopeOfNode = <T extends FileScope | NestedScope>(
  scopes: T[],
  node: SyntaxNode,
): T | undefined => scopes.find((scope) => scope.node === node)
