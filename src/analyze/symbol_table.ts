import { ProgramNode, SyntaxNode, SyntaxType } from 'tree-sitter-tony'
import { NestedScope } from '../types/analyze/scopes'
import { SymbolTable } from '../types/analyze/symbol_table'
import { assert } from '../types/errors/internal'

type State = {
  symbolTable: SymbolTable
  currentScope: SymbolTable | NestedScope
}

export const buildSymbolTable = (node: ProgramNode): SymbolTable => {
  const initialSymbolTable: SymbolTable = {
    scopes: [],
    dependencies: [],
    bindings: [],
  }
  const initialState: State = {
    symbolTable: initialSymbolTable,
    currentScope: initialSymbolTable,
  }

  const { symbolTable, currentScope } = traverse(initialState, node)
  assert(
    symbolTable === currentScope,
    'Traverse should arrive at the top-level file scope.',
  )

  return symbolTable
}

const traverse = (state: State, node: SyntaxNode): State => {
  switch (node.type) {
    case SyntaxType.Program:
      return handleProgram(state, node)
  }
}
