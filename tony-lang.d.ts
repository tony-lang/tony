import Parser from 'tree-sitter'

declare module 'tony-lang' {
  export function compile(
    file: string,
    { outFile, emit, webpackMode, verbose }: {
      outFile?: string;
      emit?: boolean;
      webpackMode?: string;
      verbose?: boolean;
    }
  ): Promise<string | undefined>

  export function exec(
    file: string,
    args: string[],
    { verbose }: { verbose?: boolean }
  ): Promise<void>

  export function parse(
    file: string,
    { verbose }: { verbose?: boolean }
  ): Promise<Parser.Tree>

  export const VERSION: string

  type Position = { row: number; column: number }

  export class CompileError extends Error {
    get context(): { start: Position; end: Position } | undefined
    get filePath(): string | undefined
  }

  export class CyclicDependenciesError extends CompileError {
    get cycilcDependency(): [string, string]
  }

  export class DuplicateBindingError extends CompileError {
    get binding(): string
  }

  export class ExportOutsideModuleScopeError extends CompileError {}

  export class ImportOutsideFileModuleScopeError extends CompileError {}

  export class InternalError extends Error {}

  export class InvalidPropertyAccessError extends CompileError {
    get property(): string
    get representation(): string
    get type(): string
  }

  export class MissingBindingError extends CompileError {
    get binding(): string
  }

  export class SyntaxError extends Error {
    get filePath(): string
    get tree(): Parser.Tree
  }

  export class TypeError extends CompileError {
    get typeTrace(): [string, string][]
  }

  export class UnknownImportError extends CompileError {
    get sourcePath(): string
  }
}
