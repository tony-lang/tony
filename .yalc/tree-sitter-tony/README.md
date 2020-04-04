# tree-sitter-tony

Tony grammar for [Tree-sitter](https://github.com/tree-sitter/tree-sitter).

Parse a file:

    $ yarn parse file.tn

---

## Testing

Generate the Tree-sitter parser:

    $ yarn install
    $ yarn generate

Run tests:

    $ yarn test

---

## Release

1. Change the version in `package.json`.
1. Create a pull request to merge the changes into `master`.
1. After the pull request was merged, create a new release listing the commits on `master` since the last release.
1. The release workflow will publish the package to NPM and GPR.
1. The prebuild workflow will upload prebuilt packages to GitHub.
