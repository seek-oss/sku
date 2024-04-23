# Contributing to sku

⚠️ 🌏 👀 First and foremost, remember that this repo is **open source**.

Don't post anything or commit any code that isn't ready for the entire world to see.
Avoid making specific reference to internal processes or features under development.
While a lot of this information is probably harmless, it's better to be safe than sorry.

If you work at SEEK and run into issues along the way, or even if you find some of these steps confusing or intimidating, please reach out to your friendly neighbourhood developer `#sku-support` channel.
We'd be happy to help out!

## Setup

1. (Optional) Fork the repo if you do not have write access
1. Clone the repo
1. Install the appropriate versions of `pnpm` and `node` as specified in `package.json` and `.nvmrc`. This repo is configured to use [`volta`]
   for managing toolchain dependencies, but feel free to use `nvm`, `corepack`, or whatever suits you best.
1. Run `pnpm run test` to ensure everything is working as expected

[`volta`]: https://volta.sh/

## Making Changes

Before starting your work, first ensure you've checked out the `master` branch and have pulled down the latest changes.

```sh
git checkout master
git pull
```

Next, create a new branch for your work, with an appropriate name for your change:

```sh
git checkout -b add-my-cool-new-feature
```

## Testing Your Changes

To run the test suite locally:

```sh
pnpm run test
```

If snapshots are out of date, you can update them with:

```sh
pnpm run test -u
```

> [!TIP]
> The test suite needs to pass for your changes to be accepted, so it's worth running this locally during development and right before committing.

Occasionally, snapshot tests from within an app fixture may fail the test suite.
Running `pnpm run test -u` at the top-level of the repo won't update these snapshots.
Instead, `cd` into the fixture directory and run that fixture's tests directly:

```sh
cd fixtures/braid-design-system
pnpm exec sku test -u
```

You can also run any `sku` CLI command against any of the app fixtures.
This can be a faster way to iterate on a feature than rather than running the test suite every time you make a change.

1. `cd` into the fixture you want to test. E.g. `cd fixtures/styling`.
1. Run your sku command. E.g. `pnpm run sku build`.

Once you've made the desired changes and you're ready to commit, stage your local changes.

> [!NOTE]
> Due to the inconsistent ordering of our test suite, dot files within the fixture directories can sometimes end up with changes.
> These changes should not be committed and can be safely discard.

## Publishing a New Version

This repo uses [changesets] for publishing new versions.
If this is your first time using changesets, please read the documentation available in the changesets repo.

[changesets]: https://github.com/changesets/changesets
