import {
  DeclarationFileScope,
  FileScope,
  GlobalScope,
  SourceFileScope,
  TypedFileScope,
} from '../types/analyze/scopes'
import { LogLevel, log } from '../logger'
import { Config } from '../config'
import { DependencyKind } from '../types/analyze/dependencies'
import { inferTypesOfDeclaration } from './declarations'
import { inferTypesOfSource } from './sources'

export const inferTypes = (
  config: Config,
  globalScope: GlobalScope<FileScope>,
): GlobalScope<TypedFileScope> => {
  log(config, LogLevel.Info, 'Running type inference')

  const typedFileScopes = globalScope.scopes.reduce<TypedFileScope[]>(
    (acc, fileScope) => [...acc, inferTypesOfFile(acc, fileScope)],
    [],
  )

  return {
    ...globalScope,
    scopes: typedFileScopes,
  }
}

const inferTypesOfFile = (
  typedFileScopes: TypedFileScope[],
  fileScope: FileScope,
): TypedFileScope => {
  switch (fileScope.dependency.kind) {
    case DependencyKind.Declaration:
      return inferTypesOfDeclaration(fileScope as DeclarationFileScope)
    case DependencyKind.Source:
      return inferTypesOfSource(typedFileScopes, fileScope as SourceFileScope)
  }
}
