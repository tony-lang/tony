import Parser from 'tree-sitter'

declare module 'tony-lang' {
  export function compile(file: string, { outFile, webpackMode, verbose }: { outFile: string, webpackMode: string, verbose: boolean }): Promise<string>

  export function exec(file: string, args: string[], { verbose }: { verbose: boolean }): Promise<void>

  export function parse(file: string, { verbose }: { verbose: boolean }): Promise<Parser.Tree>

  export const VERSION: string
}
