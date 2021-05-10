import * as Declaration from 'tree-sitter-tony/dtn'
import * as Source from 'tree-sitter-tony/tony'
import {
  FileScope,
  NestedScope,
  NestingNode,
  NestingTermLevelNode,
  ScopeWithErrors,
  ScopeWithNode,
  ScopeWithTerms,
  ScopeWithTypes,
  SourceFileScope,
  TypingEnvironment,
} from '../types/analyze/scopes'
import {
  TermBinding,
  TypeAssignment,
  TypeBinding,
  TypeVariableBinding,
} from '../types/analyze/bindings'
import { Dependency } from '../types/analyze/dependencies'
import { ErrorAnnotation } from '../types/errors/annotations'
import { isNotUndefined } from '.'
import { isSamePath } from './paths'

export const findFileScope = <T extends FileScope>(
  fileScopes: T[],
  dependency: Dependency,
): T | undefined =>
  fileScopes.find((fileScope) =>
    isSamePath(fileScope.dependency.file, dependency.file),
  )

export const addErrorToScope = <T extends ScopeWithErrors>(
  scope: T,
  node: Declaration.SyntaxNode | Source.SyntaxNode,
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

export const findScopeOfNode = <
  T extends NestingNode,
  U extends ScopeWithNode<T>,
>(
  scopes: U[],
  node: T,
): U | undefined => scopes.find((scope) => scope.node === node)

export const filterFileScopeByTermScopes = (
  scope: SourceFileScope,
): SourceFileScope<NestingTermLevelNode> => ({
  ...scope,
  scopes: scope.scopes
    .map(filterNestedScopeByTermScopes)
    .filter(isNotUndefined),
})

const filterNestedScopeByTermScopes = (
  scope: NestedScope,
): NestedScope<NestingTermLevelNode> | undefined => {
  const node = scope.node
  if (node.type === Source.SyntaxType.RefinementType) return undefined
  return {
    ...scope,
    node,
    scopes: scope.scopes
      .map(filterNestedScopeByTermScopes)
      .filter(isNotUndefined),
  }
}
