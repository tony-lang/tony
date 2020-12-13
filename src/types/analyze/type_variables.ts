import { TypeVariableDeclarationNode } from 'tree-sitter-tony'

// ---- Types ----

export interface TypeVariable {
  name: string
  node: TypeVariableDeclarationNode
}

// ---- Factories ----

export const buildTypeVariable = (
  name: string,
  node: TypeVariableDeclarationNode,
): TypeVariable => ({
  name,
  node,
})
