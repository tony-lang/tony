import * as Declaration from 'tree-sitter-tony/dtn'
import * as Source from 'tree-sitter-tony/tony'
import { AbstractState, ImportedBindingConfig } from './types'
import {
  ImportedTypeBindingNode,
  LocalTypeBinding,
  LocalTypeBindingNode,
  TermBindingNode,
  TypeBinding,
  buildImportedTermBinding,
  buildImportedTypeBinding,
  buildLocalTermBinding,
  buildLocalTypeBinding,
} from '../types/analyze/bindings'
import { buildAliasType, buildAliasedType } from './build_type'
import { findBinding, findBindings } from '../util/bindings'
import { getTerms, getTypes } from '../util/scopes'
import { assert } from '../types/errors/internal'
import { buildDuplicateBindingError } from '../types/errors/annotations'
import { ensure } from '../util/traverse'
import { getIdentifierName } from '../util/parse'
import { isPrimitiveTypeName } from '../types/type_inference/primitive_types'
import { mergeDeferredAssignments } from '../type_inference/constraints'

export const flushTermBindings = <T extends AbstractState>(state: T): T => {
  const [scope, ...parentScopes] = state.scopes
  const newScope = {
    ...scope,
    terms: [...scope.terms, ...state.terms],
  }
  return {
    ...state,
    scopes: [newScope, ...parentScopes],
    terms: [],
  }
}

export const addTermBinding =
  (
    name: string,
    isImplicit: boolean,
    isExported = false,
    importedFrom?: ImportedBindingConfig,
  ) =>
  <T extends AbstractState>(state: T, node: TermBindingNode): T => {
    const index =
      findBindings(name, [state.terms]).length +
      findBindings(name, state.scopes.map(getTerms)).length
    const binding = importedFrom
      ? buildImportedTermBinding(
          importedFrom.dependency,
          name,
          index,
          importedFrom.originalName,
          node,
          isImplicit,
          isExported,
        )
      : buildLocalTermBinding(name, index, node, isImplicit, isExported)
    return {
      ...state,
      terms: [...state.terms, binding],
    }
  }

export const addTypeBinding =
  (name: string, isExported = false, importedFrom?: ImportedBindingConfig) =>
  <T extends AbstractState>(
    state: T,
    node: LocalTypeBindingNode | ImportedTypeBindingNode,
  ): T =>
    ensure<T, LocalTypeBindingNode | ImportedTypeBindingNode>(
      (state) =>
        findBinding(name, state.scopes.map(getTypes)) === undefined &&
        !isPrimitiveTypeName(name),
      (state, node) => {
        const [stateWithBinding, binding] = buildTypeBinding(
          state,
          node,
          name,
          isExported,
          importedFrom,
        )
        const [scope, ...parentScopes] = stateWithBinding.scopes
        const newScope = {
          ...scope,
          types: [...scope.types, binding],
        }
        return {
          ...stateWithBinding,
          scopes: [newScope, ...parentScopes],
        }
      },
      buildDuplicateBindingError(name),
    )(state, node)

const buildTypeBinding = <T extends AbstractState>(
  state: T,
  node: LocalTypeBindingNode | ImportedTypeBindingNode,
  name: string,
  isExported: boolean,
  importedFrom: ImportedBindingConfig | undefined,
): [newState: T, binding: TypeBinding] => {
  if (importedFrom) {
    assert(
      node.type === Declaration.SyntaxType.ImportType ||
        node.type === Source.SyntaxType.ImportType,
      'node should be an imported type when importConfig is given',
    )
    return [
      state,
      buildImportedTypeBinding(
        importedFrom.dependency,
        name,
        importedFrom.originalName,
        node,
        isExported,
      ),
    ]
  }

  assert(
    node.type === Source.SyntaxType.Class ||
      node.type === Source.SyntaxType.Enum ||
      node.type === Source.SyntaxType.TypeAlias,
    'node should be type binding node when importConfig is not given',
  )
  return buildTypesForLocalBinding(state, name, node, isExported)
}

const buildTypesForLocalBinding = <T extends AbstractState>(
  state: T,
  name: string,
  node: LocalTypeBindingNode,
  isExported: boolean,
): [newState: T, binding: LocalTypeBinding] => {
  const [stateWithAliasType, deferredAssignmentsFromAliasType, aliasType] =
    buildAliasType(state, node)
  const [
    stateWithAliasedType,
    deferredAssignmentsFromAliasedType,
    aliasedType,
  ] = buildAliasedType(stateWithAliasType, node)
  return [
    stateWithAliasedType,
    buildLocalTypeBinding(
      name,
      aliasType,
      aliasedType,
      node,
      mergeDeferredAssignments(
        deferredAssignmentsFromAliasType,
        deferredAssignmentsFromAliasedType,
      ),
      isExported,
    ),
  ]
}

export const handleIdentifierPatternName = <T extends AbstractState>(
  state: T,
  node: Source.IdentifierPatternNameNode,
): T => {
  const {
    exportNextBindings: isExported,
    nextIdentifierPatternBindingsImplicit: isImplicit,
    importNextBindingsFrom: importedFrom,
  } = state
  const name = getIdentifierName(node)
  return addTermBinding(
    name,
    !!isImplicit,
    isExported,
    importedFrom,
  )(state, node)
}
