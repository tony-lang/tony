# The Tony programming language

Listen to changes and make them accessible through `tony` from the command line:

    $ yarn start

Run ESLint:

    $ yarn eslint

Run TypeScript compiler checks:

    $ yarn tsc

Run tests:

    $ yarn test

## Release

1. Review breaking changes and deprecations in `CHANGELOG.md`.
1. Change the version in `package.json` and `src/version.ts`.
1. Reset `CHANGELOG.md`.
1. Create a pull request to merge the changes into `master`.
1. After the pull request was merged, create a new release listing the breaking changes and commits on `master` since the last release.
1. The release workflow will publish the package to NPM and GPR.
