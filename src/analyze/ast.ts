import { ProgramNode, SyntaxNode, SyntaxType } from 'tree-sitter-tony'
import { Node, Program } from '../types/analyze/ast'
import { SymbolTable } from '../types/analyze/symbol_table'

const traverse = (symbolTable: SymbolTable, node: SyntaxNode): Node => {
  switch (node.type) {
    case SyntaxType.Program:
      return handleProgram(symbolTable, node)
  }
}

const handleProgram = (
  symbolTable: SymbolTable,
  node: ProgramNode,
): Program => {}

export const buildAST = handleProgram
