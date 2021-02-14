import { Config } from '../config'
import { DeclarationDependency } from '../types/analyze/dependencies'
import {
  DeclarationFileScope,
  buildDeclarationFileScope,
} from '../types/analyze/scopes'
import {
  DeclarationMemberNode,
  DeclarationNode,
  ProgramNode,
} from 'tree-sitter-tony/dtn'
import { AbstractState } from './types'
import { handleImports } from './imports'
import { getIdentifierName, parseRawString } from '../util/parse'
import { buildAbsolutePath } from '../types/path'
import { findBinding } from '../util/bindings'
import { getTerms } from '../util/scopes'
import { buildDeclaredTermBinding } from '../types/analyze/bindings'
import { ensure } from '../util/traverse'
import { buildDuplicateBindingError } from '../types/errors/annotations'

type State = AbstractState & {
  scopes: [DeclarationFileScope]
}

export const constructFileScopeFromDeclaration = async (
  config: Config,
  dependency: DeclarationDependency,
  node: ProgramNode,
): Promise<DeclarationFileScope> => {
  const source = buildAbsolutePath(
    dependency.file.path,
    parseRawString(node.declarationNode.nameNode),
  )
  const initialFileScope = buildDeclarationFileScope(dependency, source, node)
  const initialState: State = {
    config,
    file: dependency.file,
    scopes: [initialFileScope],
    terms: [],
  }

  const stateWithImports = await handleImports(initialState, node.importNodes)
  const {
    scopes: [fileScope],
  } = handleDeclaration(stateWithImports, node.declarationNode)

  return fileScope
}

const declareBinding = (name: string) =>
  ensure<State, DeclarationMemberNode>(
    (state) => findBinding(name, state.scopes.map(getTerms)) === undefined,
    (state, node) => {
      const binding = buildDeclaredTermBinding(name, node)
      return {
        ...state,
        terms: [...state.terms, binding],
      }
    },
    buildDuplicateBindingError(name),
  )

const handleDeclaration = (state: State, node: DeclarationNode) => {
  return node.memberNodes.reduce<State>(handleDeclarationMember, state)
}

const handleDeclarationMember = (
  state: State,
  node: DeclarationMemberNode,
): State => {
  const name = getIdentifierName(node.nameNode)
  return declareBinding(name)(state, node)
}
