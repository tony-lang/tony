import Parser from 'tree-sitter'

import { Context } from './src/errors/CompileError'
import { TypeMismatch } from './src/errors/TypeError'

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

  export class CompileError extends Error {
    get context(): Context | undefined
    get filePath(): string | undefined
  }

  export class DuplicateBindingError extends CompileError {
    get binding(): string
  }

  export class InternalError extends Error {
    get context(): string | undefined
  }

  export class MissingBindingError extends CompileError {
    get binding(): string
    get representation(): string | undefined
    get type(): string | undefined
  }

  export class SyntaxError extends Error {
    get filePath(): string
    get tree(): Parser.Tree
  }

  export class TypeError extends CompileError {
    get typeTrace(): TypeMismatch[]
  }
}
