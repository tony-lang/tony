import { ProgramNode, SyntaxNode, SyntaxType } from 'tree-sitter-tony'
import { Node, Program } from '../types/analyze/ast'
import { SymbolTable } from '../types/analyze/scopes'

// TODO: check with identifiers if binding is defined
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

export const constructAST = handleProgram
