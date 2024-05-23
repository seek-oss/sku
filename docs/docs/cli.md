# CLI

The `sku` command line interface (CLI) is the primary way to interact with your project. It provides a number of commands to help you develop, build and test your application.

## CLI Options

| Options       | Description                                                                              |
| ------------- | ---------------------------------------------------------------------------------------- |
| `-D, --debug` | Enable debug logging <br> `sku start --debug`                                            |
| `--config`    | Specify a custom path to your sku config <br> `sku build --config path/to/custom/config` |

## CLI Commands

### `init`

Initialize a new `sku` project.
Unless you've installed `sku` globally (not recommended), you should use `npx` or `pnpm dlx` to run this command:

```sh
pnpm dlx sku init my-app
```

### `start`

Start the `sku` development server for a [statically-rendered application][static rendering].

```sh
sku start
```

[static rendering]: ./docs/building-the-app.md#render

### `start-ssr`

Start the `sku` development server for a [server-rendered application][server rendering].

```sh
sku start-ssr
```

[server rendering]: ./docs/building-the-app.md#server

### `build`

Create a production build of a [statically-rendered application][static rendering].

```sh
sku build
```

[static rendering]: ./docs/building-the-app.md#render

### `build-ssr`

Create a production build of a [server-rendered application][server rendering].

```sh
sku build-ssr
```

[server rendering]: ./docs/building-the-app.md#server

### `serve`

Serve a production build of a [statically-rendered application][static rendering].
Will not work unless [`sku build`] has been run.

```sh
sku serve
```

[`sku build`]: #sku-build

### `test`

Run unit tests.
See the [testing documentation] for more information.

```sh
sku test
```

[testing documentation]: ./docs/testing.md

### `lint`

Run lint tooling over your code.
See [linting/formatting documentation] for more information.

```sh
sku lint
```

[linting/formatting documentation]: ./docs/linting.md

### `format`

See [linting/formatting documentation] for more information.

```sh
sku format
```

[linting/formatting documentation]: ./docs/linting.md

### `storybook`

Starts a local Storybook server.
See the Storybook documentation for more information.

```sh
sku storybook
```

[Storybook documentation]: ./docs/storybook.md

### `build-storybook`

Builds a static version of your Storybook.
See the Storybook documentation for more information.

```sh
sku build-storybook
```

[Storybook documentation]: ./docs/storybook.md

### `pre-commit`

Runs the `sku` pre-commit hook.
See the [pre-commit hook documentation] for more information.

```sh
sku pre-commit
```

[pre-commit hook documentation]: ./docs/extra-features.md#pre-commit-hook

### `setup-hosts`

Updates your hosts file to point any configured [`hosts`] to your local machine.

```sh
sudo sku setup-hosts
```

[`hosts`]: ./docs/configuration.md#hosts

### `configure`

Emits and updates configuration files for your project.
This command is run before most other `sku` CLI commands, so you shouldn't need to run it manually.

```sh
sku configure
```

## Translations

Translation-specific commands.
These commands are only useful if your application is configured to be a [multi-language application].

[multi-language application]: ./docs/multi-language-applications.md

### `translations compile`

Compile translations defined in `.vocab` directories.

```sh
sku translations compile
```

### `translations push`

Pushes translations to Phrase.
See the documentation on [phrase-specific features] for more information.

```sh
sku translations push
```

This command supports the following options:

| Options                | Description                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `--delete-unused-keys` | Deletes keys that were not referenced in the upload <br> `sku translations push --delete-unused-keys` |

[phrase-specific features]: ./docs/multi-language-applications.md#phrase-specific-features

### `translations pull`

Pulls translations from Phrase.
See the documentation on [phrase-specific features] for more information.

```sh
sku translations pull
```

[phrase-specific features]: ./docs/multi-language-applications.md#phrase-specific-features
