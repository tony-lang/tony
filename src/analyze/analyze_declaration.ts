import { Config } from '../config'
import { DeclarationDependency } from '../types/analyze/dependencies'
import { FileScope } from '../types/analyze/scopes'
import { ProgramNode } from 'tree-sitter-tony/dtn'

export const constructFileScopeFromDeclaration = async (
  config: Config,
  dependency: DeclarationDependency,
  node: ProgramNode,
): Promise<FileScope<DeclarationDependency>> => {}
