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
1. Install the appropriate versions of `pnpm` and `node` as specified in `package.json` and `.nvmrc` respectively

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

### Boilerplate Generation

This repo uses [plop] to scaffold new features. You can run `pnpm run plop` to see a list of available generators.

> [!NOTE]
> Always use plop to generate boilerplate before starting your changes. This ensures consistency across the codebase.

Once you select the plop generator you want to use, you will be prompted for additional information to generate the desired boilerplate files.

The following generators are available:

| Generator         | Description                                                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `add-sku-command` | **Create a new command for the `sku` `CLI` program** <br><br> This generator allows for sub-command generation with a depth of one. This will modify the parent command file |
| `add-sku-codemod` | **Create a new codemod for the `sku-codemod` `CLI` program**                                                                                                                 |

[plop]: https://plopjs.com/

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

If snapshots are out of date, you can update them with:

```sh
pnpm run test:update
```

> [!TIP]
> The test suite needs to pass for your changes to be accepted, so it's worth running this locally during development and right before committing.

You can also run commands directly against any of the app fixtures.
This can be a faster way to iterate on a feature than rather than running the test suite every time you make a change.

There are 3 ways to run commands against a fixture:

1. Run `pnpm fixture [fuzzy-fixture] [script]`, runs a `package.json` script with a fuzzy name search on fixture directories. Running with no arguments will list all fixtures and scripts.
2. `cd` into the fixture and run a command directly: `cd fixtures/styling && pnpm sku start`.

> [!TIP]
> `pnpm fixture` lists scripts in a fixture's `package.json` file.
> If there's a script that's commonly run in a specific fixture, feel free to add it to the `package.json` file.

Once you've made the desired changes and you're ready to commit, stage your local changes.

> [!NOTE]
> Due to the inconsistent ordering of our test suite, dot files within the fixture directories can sometimes end up with changes.
> These changes should not be committed and can be safely discard.

### Testing Codemods

Codemods are tested via the `sku-codemod` E2E test suite.
Input and output files are defined inline in the test file.

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
