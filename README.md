# The Tony programming language

Tony is a strongly typed, high level, general purpose programming language built for parallelism.

[Documentation](https://tony-lang.github.io/)

This repository is home to the compiler and the type inference algorithm of Tony. Other core components of Tony can be found here:

* [Parser](https://github.com/tony-lang/tree-sitter-tony)
* [CLI](https://github.com/tony-lang/cli)

## API

tbc

### `compile`

### `exec`

### `run`

### `parse`

### Errors

## Release

1. Review breaking changes and deprecations in `CHANGELOG.md`.
1. Change the version in `package.json` and `src/version.ts`.
1. Reset `CHANGELOG.md`.
1. Create a pull request to merge the changes into `master`.
1. After the pull request was merged, create a new release listing the breaking changes and commits on `master` since the last release.
1. The release workflow will publish the package to NPM and GPR.
