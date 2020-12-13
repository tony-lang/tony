import { TypeVariableNode } from 'tree-sitter-tony'

// ---- Types ----

export interface TypeVariable {
  name: string
  node: TypeVariableNode
}

// ---- Factories ----

export const buildTypeVariable = (
  name: string,
  node: TypeVariableNode,
): TypeVariable => ({
  name,
  node,
})
