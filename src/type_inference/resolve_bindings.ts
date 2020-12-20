import { ConstrainedType, Type } from '../types/type_inference/types'
import {
  addErrorToScope,
  findBindingOfKind,
  findFileScope,
} from '../util/analyze'
import {
  buildUnknownFileError,
  buildUnknownImportError,
} from '../types/errors/annotations'
import { Answer } from '../types/type_inference/answers'
import { Binding } from '../types/analyze/bindings'
import { SyntaxNode } from 'tree-sitter-tony'
import { TypedFileScope } from '../types/analyze/scopes'
import { assert } from '../types/errors/internal'
import { buildUnconstrainedUnknownType } from '../util/types'

export const resolveBindingType = (
  fileScopes: TypedFileScope[],
  binding: Binding,
  scope: TypedFileScope,
): [type: ConstrainedType<Type>, newScope: TypedFileScope] => {
  if (binding.importedFrom === undefined)
    return [resolveBindingTypeWithinScope(binding, scope), scope]

  const { file, originalName } = binding.importedFrom
  const importedBindingName = originalName || binding.name
  const fileScope = findFileScope(fileScopes, file)
  if (fileScope === undefined)
    return [
      buildUnconstrainedUnknownType(),
      addErrorToScope(scope, binding.node, buildUnknownFileError(file)),
    ]

  const importedBinding = findBindingOfKind(binding.kind)(importedBindingName, [
    fileScope,
  ])
  if (importedBinding === undefined || !importedBinding.isExported)
    return [
      buildUnconstrainedUnknownType(),
      addErrorToScope(
        scope,
        binding.node,
        buildUnknownImportError(file, importedBindingName),
      ),
    ]

  return [resolveBindingTypeWithinScope(importedBinding, fileScope), scope]
}

const resolveBindingTypeWithinScope = (
  binding: Binding,
  scope: TypedFileScope,
): ConstrainedType<Type> => findTypedNode(binding.node, scope).type

const findTypedNode = <T extends SyntaxNode>(
  node: T,
  scope: TypedFileScope,
): Answer<T> => {
  const nodeHeritage = buildNodeHeritage(node)
  return nodeHeritage.reduce<Answer<SyntaxNode>>(
    (typedNode, node) => {
      const typedChild = typedNode.childNodes.find(
        (child) => child.node === node,
      )
      assert(
        typedChild !== undefined,
        'Typed nodes should resemble the same tree as untyped nodes.',
      )
      return typedChild
    },
    scope.typedNode,
  ) as Answer<T>
}

/**
 * Returns an array resembling the heritage of a node from the program node to
 * the given node.
 */
const buildNodeHeritage = (
  node: SyntaxNode,
  heritage: SyntaxNode[] = [],
): SyntaxNode[] => {
  const newHeritage = [node, ...heritage]
  if (node.parent === null) return newHeritage
  return buildNodeHeritage(node.parent, newHeritage)
}
