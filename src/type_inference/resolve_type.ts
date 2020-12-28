import { ConstrainedType, NamedType } from '../types/type_inference/types'
import {
  EnumNode,
  InterfaceNode,
  TypeAliasNode,
  TypeVariableDeclarationNode,
} from 'tree-sitter-tony'
import { Buffer } from '../types/buffer'
import { TypeBinding } from '../types/analyze/bindings'

/**
 * Given a node in the syntax tree and its scope stack, returns the type
 * corresponding to the node.
 */
export const resolveType = (
  typeBindings: Buffer<TypeBinding[]>,
  node: EnumNode | InterfaceNode | TypeAliasNode | TypeVariableDeclarationNode,
): ConstrainedType<NamedType> => {}
