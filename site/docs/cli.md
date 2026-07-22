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

[environment]: ./configuration.md#environments
[`start`]: #start
[`serve`]: #serve

## CLI Commands

### `start`

Start the `sku` development server for a [Static](./static-rendering.md) or [SSR](./ssr/) app (`sku start`).

```sh
sku start
```

This command supports the following options:

| Option            | Description                                                                                         | Defaults to |
| ----------------- | --------------------------------------------------------------------------------------------------- | ----------- |
| `--stats, -s`     | The webpack [stats preset] used to override the default <br> `sku build --stats=errors-only`        | `summary`   |
| `--port`          | The port to serve the dev server on.                                                                |             |
| `--strict-port`   | Will make sku throw an error if the given port is already in use.                                   | `false`     |
| `--list-urls, -l` | Lists all dev server urls the app can be accessed on. If false, only displays the first found host. | `false`     |

### `start-ssr`

**Webpack SSR Only**

Start the development server for a [Webpack SSR](./ssr/webpack-ssr.md) app (`renderCallback` path).
[SSR](./ssr/) apps (`buildType: 'ssr'`) use [`start`](#start) instead.

```sh
sku start-ssr
```

This command supports the following options:

| Option            | Description                                                                                         | Defaults to |
| ----------------- | --------------------------------------------------------------------------------------------------- | ----------- |
| `--stats, -s`     | The webpack [stats preset] used to override the default <br> `sku build --stats=errors-only`        | `summary`   |
| `--list-urls, -l` | Lists all dev server urls the app can be accessed on. If false, only displays the first found host. | `false`     |

### `build`

Create a production build of a [Static](./static-rendering.md) or [SSR](./ssr/) app (`sku build`).
Webpack static apps also use this command.

```sh
sku build
```

This command supports the following options:

| Option        | Description                                                                                  | Defaults to   |
| ------------- | -------------------------------------------------------------------------------------------- | ------------- |
| `--stats, -s` | The webpack [stats preset] used to override the default <br> `sku build --stats=errors-only` | `errors-only` |

### `build-ssr`

**Webpack SSR Only**

Create a production build of a [Webpack SSR](./ssr/webpack-ssr.md) app.
[SSR](./ssr/) apps (`buildType: 'ssr'`) use [`build`](#build) instead.

```sh
sku build-ssr
```

This command supports the following options:

| Option        | Description                                                                                  | Defaults to   |
| ------------- | -------------------------------------------------------------------------------------------- | ------------- |
| `--stats, -s` | The webpack [stats preset] used to override the default <br> `sku build --stats=errors-only` | `errors-only` |

### `serve`

Serve a production build of a [Static](./static-rendering.md) app from your local machine.
Requires [`sku build`] to be run first.

```sh
sku serve
```

This command supports the following options:

| Option            | Description                                                                                         | Defaults to |
| ----------------- | --------------------------------------------------------------------------------------------------- | ----------- |
| `--port`          | The `port` to serve the application on <br> `sku serve --port=8080`                                 |
| `--site`          | The `site` to serve the application on <br> `sku serve --site=seekAnz`                              |
| `--list-urls, -l` | Lists all dev server urls the app can be accessed on. If false, only displays the first found host. | `false`     |

[`sku build`]: #sku-build

### `test`

Run unit tests.
See the [testing documentation] for more information.

```sh
sku test
```

[testing documentation]: ./testing.md

### `lint`

Run lint tooling over your code.
See the [linting/formatting documentation] for more information.

```sh
sku lint
```

[linting/formatting documentation]: ./linting.md

### `format`

Apply all available lint and formatting fixes.
See the [linting/formatting documentation] for more information.

```sh
sku format
```

[linting/formatting documentation]: ./linting.md

### `setup-hosts`

Update your hosts file to point any configured [`hosts`] to your local machine.

```sh
sudo sku setup-hosts
```

[`hosts`]: ./configuration.md#hosts

### `configure`

Emit and update configuration files for your project.
This command is run before most other `sku` CLI commands, so you shouldn't need to run it manually.

```sh
sku configure
```

## Translations

Translation-specific commands.
These commands are only useful if your application is configured to be a [multi-language application].

[multi-language application]: ./multi-language.md

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

| Option                 | Description                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `--auto-translate`     | Instructs Phrase to automatically translate any missing keys using machine translation. `sku translations push --auto-translate` |
| `--delete-unused-keys` | Deletes keys that were not referenced in the upload <br> `sku translations push --delete-unused-keys`                            |

### `translations pull`

Pull translations from Phrase.
See the documentation on [phrase-specific features] for more information.

```sh
sku translations pull
```

[phrase-specific features]: ./multi-language.md#phrase-specific-features

### `translations validate`

Validate translations defined in `.vocab` directories.

```sh
sku translations validate
```

[stats preset]: https://webpack.js.org/configuration/stats/#stats-presets
