# CLI

The `sku` command line interface (CLI) is the primary way to interact with your project.
It provides a number of commands to help you develop, test and build your application.

## CLI Options

| Option              | Description                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--debug, -D`       | Enable debug logging <br> `sku start --debug`                                                                                |
| `--config, -c`      | Specify a custom path to your sku config <br> `sku build --config path/to/custom/config`                                     |
| `--environment, -e` | Specify the [environment] to use (only valid for [`start`] and [`serve`] commands) <br> `sku start --environment production` |
| `--help, -h`        | Show help output for the current command <br> `sku --help`                                                                   |
| `--version, -v`     | Show the version of `sku` that is currently installed <br> `sku --version`                                                   |

[environment]: ./docs/configuration.md#environments
[`start`]: #start
[`serve`]: #serve

## CLI Commands

### `init`

Initialize a new `sku` project.
Unless you've installed `sku` globally (not recommended), you should use `npx` or `pnpm dlx` to run this command:

```sh
pnpm dlx sku init my-app
```

This command supports the following options and arguments:

| Type     | Name                           | Description                                                                                                                                                                                  |
| -------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| argument | `project-name` <br> _required_ | The name of the project to create <br> `pnpm dlx sku init my-app`                                                                                                                            |
| option   | `--package-manager, -p`        | Overrides the package manager used when installing dependencies <br> This defaults to the package manager being used to run `sku init` <br> `pnpm dlx sku init my-app --package-manager=npm` |
| option   | `--verbose`                    | Enable verbose logging for the package manager <br> `pnpm dlx sku init my-app --verbose`                                                                                                     |

### `start`

Start the `sku` development server for a [statically-rendered application][static rendering].

```sh
sku start
```

This command supports the following options:

| Option        | Description                                                                                 | Defaults to |
| ------------- | ------------------------------------------------------------------------------------------- | ----------- |
| `--stats, -s` | The webpack [stats preset] used to override the default <br> `sku buid --stats=errors-only` | `summary`   |

[static rendering]: ./docs/building-the-app.md#render

### `start-ssr`

Start the `sku` development server for a [server-rendered application][server rendering].

```sh
sku start-ssr
```

This command supports the following options:

| Option        | Description                                                                                 | Defaults to |
| ------------- | ------------------------------------------------------------------------------------------- | ----------- |
| `--stats, -s` | The webpack [stats preset] used to override the default <br> `sku buid --stats=errors-only` | `summary`   |

[server rendering]: ./docs/building-the-app.md#server

### `build`

Create a production build of a [statically-rendered application][static rendering].

```sh
sku build
```

This command supports the following options:

| Option        | Description                                                                                 | Defaults to   |
| ------------- | ------------------------------------------------------------------------------------------- | ------------- |
| `--stats, -s` | The webpack [stats preset] used to override the default <br> `sku buid --stats=errors-only` | `errors-only` |

[static rendering]: ./docs/building-the-app.md#render

### `build-ssr`

Create a production build of a [server-rendered application][server rendering].

```sh
sku build-ssr
```

This command supports the following options:

| Option        | Description                                                                                 | Defaults to   |
| ------------- | ------------------------------------------------------------------------------------------- | ------------- |
| `--stats, -s` | The webpack [stats preset] used to override the default <br> `sku buid --stats=errors-only` | `errors-only` |

[server rendering]: ./docs/building-the-app.md#server

### `serve`

Serve a production build of a [statically-rendered application][static rendering] from your local machine.
Requires [`sku build`] to be run first.

```sh
sku serve
```

This command supports the following options:

| Option   | Description                                                            |
| -------- | ---------------------------------------------------------------------- |
| `--port` | The `port` to serve the application on <br> `sku serve --port=8080`    |
| `--site` | The `site` to serve the application on <br> `sku serve --site=seekAnz` |

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
See the [linting/formatting documentation] for more information.

```sh
sku lint
```

[linting/formatting documentation]: ./docs/linting.md

### `format`

Apply all available lint and formatting fixes.
See the [linting/formatting documentation] for more information.

```sh
sku format
```

[linting/formatting documentation]: ./docs/linting.md

### `pre-commit`

Run the `sku` pre-commit hook.
See the [pre-commit hook documentation] for more information.

```sh
sku pre-commit
```

[pre-commit hook documentation]: ./docs/extra-features.md#pre-commit-hook

### `setup-hosts`

Update your hosts file to point any configured [`hosts`] to your local machine.

```sh
sudo sku setup-hosts
```

[`hosts`]: ./docs/configuration.md#hosts

### `configure`

Emit and update configuration files for your project.
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

This command supports the following options:

| Option        | Description                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `--watch, -w` | Re-compile translations whenever changes are detected <br> `sku translations compile  --watch` |

### `translations push`

Push translations to Phrase.
See the documentation on [phrase-specific features] for more information.

```sh
sku translations push
```

This command supports the following options:

| Option                 | Description                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `--delete-unused-keys` | Deletes keys that were not referenced in the upload <br> `sku translations push --delete-unused-keys` |

[phrase-specific features]: ./docs/multi-language-applications.md#phrase-specific-features

### `translations pull`

Pull translations from Phrase.
See the documentation on [phrase-specific features] for more information.

```sh
sku translations pull
```

### `translations validate`

Validate translations defined in `.vocab` directories.

```sh
sku translations validate
```

[phrase-specific features]: ./docs/multi-language-applications.md#phrase-specific-features
[stats preset]: https://webpack.js.org/configuration/stats/#stats-presets
