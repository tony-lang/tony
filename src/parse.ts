import Declaration, { Tree as DeclarationTree } from 'tree-sitter-tony/dtn'
import {
  DeclarationDependency,
  SourceDependency,
} from './types/analyze/dependencies'
import { LogLevel, log } from './logger'
import Source, { Tree as SourceTree } from 'tree-sitter-tony/tony'
import { Config } from './config'
import Parser from 'tree-sitter'
import { readFile } from './util/paths'

const parser = new Parser()

export const parseDeclaration = async (
  config: Config,
  dependency: DeclarationDependency,
): Promise<DeclarationTree> => {
  parser.setLanguage(Declaration)
  log(config, LogLevel.Info, 'Parsing', dependency.file.path)

  const sourceCode = await readFile(dependency.file)
  return parser.parse(sourceCode) as DeclarationTree
}

export const parseSource = async (
  config: Config,
  dependency: SourceDependency,
): Promise<SourceTree> => {
  parser.setLanguage(Source)
  log(config, LogLevel.Info, 'Parsing', dependency.file.path)

  const sourceCode = await readFile(dependency.file)
  return parser.parse(sourceCode) as SourceTree
}
