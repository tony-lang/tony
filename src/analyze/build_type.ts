import { FileScope, NestedScope } from '../types/analyze/scopes'
import { TypeNode, TypeVariableDeclarationNameNode } from 'tree-sitter-tony'
import { Buffer } from '../types/buffer'
import { NamedType } from '../types/type_inference/types'

export const buildNamedType = (
  scopes: Buffer<FileScope | NestedScope>,
  node: TypeNode | TypeVariableDeclarationNameNode,
): NamedType => {}
