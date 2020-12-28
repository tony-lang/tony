import { ConcreteScope, FileScope, ObjectScope } from '../types/analyze/scopes'
import { TermBinding, TypeBinding } from '../types/analyze/bindings'
import { AbsolutePath } from '../types/path'
import { ErrorAnnotation } from '../types/errors/annotations'
import { SyntaxNode } from 'tree-sitter-tony'
import { isSamePath } from './paths'

export const findFileScope = <T extends FileScope>(
  fileScopes: T[],
  file: AbsolutePath,
): T | undefined =>
  fileScopes.find((fileScope) => isSamePath(fileScope.file, file))

export const addErrorToScope = <T extends ConcreteScope>(
  scope: T,
  node: SyntaxNode,
  error: ErrorAnnotation,
): T => ({
  ...scope,
  errors: [...scope.errors, { node, error }],
})

export const getTermBindings = (scope: ObjectScope): TermBinding[] =>
  scope.bindings
export const getTypeBindings = (scope: ConcreteScope): TypeBinding[] =>
  scope.typeBindings
