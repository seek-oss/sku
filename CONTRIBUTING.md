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

Before running tests, some entries need to be added to your `/etc/hosts` file.

| Hostname            | IP Address  |
| ------------------- | ----------- |
| `dev.seek.com.au`   | `127.0.0.1` |
| `dev.jobstreet.com` | `127.0.0.1` |

This can either be done manually, or via the following script:

```sh
sudo pnpm setup-test-hosts
```

To run the test suite locally:

```sh
pnpm run test
```

> [!NOTE]
> The [`sku-init` test suite] is not run as part of the `test` script.
> The test is run separately as it can conflict with other tests running in parallel.
> It is always run on CI, but it can be run locally with `pnpm run test:sku-init`.

If snapshots are out of date, you can update them with:

```sh
pnpm run test:update
```

The test suite needs to pass for your changes to be accepted, so it's worth running this locally during development and right before committing.

> [!NOTE]
> Due to the inconsistent ordering of our test suite, dot files within the fixture directories can sometimes end up with changes.
> These changes should not be committed and can be safely discard.

[`sku-init` test suite]: ./fixtures/sku-init/sku-init.test.js

## Publishing a New Version

This repo uses [changesets] for publishing new versions.
If this is your first time using changesets, please read the documentation available in the changesets repo.

[changesets]: https://github.com/changesets/changesets

## Editing Documentation

The documentation site is generated from markdown files in [the `docs` directory].
To start a local development server for the documentation site, run the following script:

```sh
pnpm start:docs
```

[the `docs` directory]: ./docs/docs

## Troubleshooting

When running `lint`, if you encounter an error about a missing ESLint configuration file, you can run the following command to regenerate all sku fixture configuration files:

```sh
pnpm --filter="@sku-fixtures/*" exec sku configure
```
