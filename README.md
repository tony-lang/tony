# The Tony programming language

Tony is a strongly typed, high level, general purpose programming language built for parallelism.

[**Documentation**](https://tony-lang.github.io/), [Install](https://tony-lang.github.io/docs/cli/install)

| [API](#api) | [Errors](#errors) |
| ----------- | ----------------- |

This repository is home to the compiler and the type inference algorithm of Tony. Other core components of Tony can be found through the following links:

* [Parser](https://github.com/tony-lang/tree-sitter-tony)
* [CLI](https://github.com/tony-lang/cli)

## API

The functionality of the Tony compiler is exposed by the `tony-lang` package.

After installing the package, provided functions can be imported:

```js
import * as Tony from 'tony-lang'
```

### `compile`

```ts
function compile(
  file: string,
  { outFile, emit, webpackMode, verbose }: {
    outFile?: string;
    emit?: boolean;
    webpackMode?: string;
    verbose?: boolean;
  }
): Promise<string | undefined>
```

Resolves imports, infers and checks types, and compiles the given file to JavaScript. Returns the path to compiled Javascript entry.

### `exec`

```ts
function exec(
  file: string,
  args: string[],
  { verbose }: { verbose?: boolean }
): Promise<void>
```

Executes a compiled JavaScript file with the provided arguments.

### `parse`

```ts
export function parse(
  file: string,
  { verbose }: { verbose?: boolean }
): Promise<Parser.Tree>
```

Parses the given file and returns a [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) (abstract syntax) tree.

## Errors

There are three separate classes of errors that the Tony compiler may throw:

* `SyntaxError`, indicates a syntactic error.
* `CompileError`, indicates a semantic problem.
* `InternalError`, indicates a bug in the compiler and should be reported in the [issue tracker](https://github.com/tony-lang/tony/issues).

### `SyntaxError`

Is thrown when the [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) parser is unable to parse a file.

Contains attributes `filePath: string` and `tree: Parser.Tree`. `message` is set to `undefined`.

### `CompileError`

`CompileError` is abstract. Therefore, only instances of subclasses may be thrown.

Contains `filePath: string` and `context: { start: { row: number; column: number }; end: { row: number; column: number } }`.

#### `CycilcDependenciesError`

Is thrown when the dependency graph is not acyclic.

Contains `cyclicDependency: [string, string]` representing file Paths where the latter one is a dependency to the first one. `message` is set to `undefined`.

#### `DuplicateBindingError`

Is thrown when an identifier or type is assigned to/declared multiple times.

Contains `binding: string` representing the duplicate identifier/type. `message` is set to `undefined`.

#### `ExportOutsideModuleScopeError`

Is thrown when the `export` expression is used outside of a module scope.

`message` is set to `undefined`.

#### `ImportOutsideFileModuleScopeError`

Is thrown when `import` is used outside of a file-level module scope.

`message` is set to `undefined`.

#### `InvalidPropertyAccessError`

Is thrown when a property is accessed that does not exist on the accessed value type.

Contains `property: string` representing the accessed property, `representation: string` (i.e. the representation of the accessed value), and `type: string` (i.e. the type of the accessed value). `message` is set to `undefined`.

#### `MissingBindingError`

Is thrown when the value of an unassigned/undeclared identifier/type is attempted to be used.

Contains `binding: string` representing the missing identifier/type. `message` is set to `undefined`.

#### `TypeError`

Is thrown when two types cannot be unified.

Contains `typeTrace: [string, string][]` representing a trace of mismatches from narrowest to broadest.

#### `UnknownImportError`

Is thrown when the extension of an imported file cannot be handled by Tony.

Contains `sourcePath: string` representing the file that could not be imprted. `message` is set to `undefined`.

### `InternalError`

Errors of this class should not be thrown. If they are, they should be reported in the [issue tracker](https://github.com/tony-lang/tony/issues) immediately.

Contains a `message: string` and (optionally) additional `context: string`.

## Release

1. Review breaking changes and deprecations in `CHANGELOG.md`.
1. Change the version in `package.json` and `src/version.ts`.
1. Reset `CHANGELOG.md`.
1. Create a pull request to merge the changes into `master`.
1. After the pull request was merged, create a new release listing the breaking changes and commits on `master` since the last release.
1. The release workflow will publish the package to NPM and GPR.
