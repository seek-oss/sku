[![npm](https://img.shields.io/npm/v/sku.svg?style=flat-square)](https://www.npmjs.com/package/sku)

<br />
<img src="https://github.com/seek-oss/sku/raw/master/docs/logo/logo.png?raw=true" alt="sku" title="sku" width="147" height="79" />
<br />

Front-end development toolkit, powered by [Webpack](https://webpack.js.org/), [Babel](https://babeljs.io/), [Vanilla Extract](https://vanilla-extract.style/), [ESLint](http://eslint.org/), [Prettier](https://prettier.io/) and [Jest](https://facebook.github.io/jest/).

Quickly get up and running with a zero-config development environment, or optionally add minimal config when needed.
Designed for usage with [braid-design-system](https://github.com/seek-oss/braid-design-system), although this isn't a requirement.

This tool is heavily inspired by other work, most notably:

- [facebookincubator/create-react-app](https://github.com/facebookincubator/create-react-app)
- [insin/nwb](https://github.com/insin/nwb)
- [NYTimes/kyt](https://github.com/NYTimes/kyt)

> [!WARNING]
> While this software is open source, its primary purpose is to improve consistency, cross-team collaboration and code quality at SEEK.
> As a result, it’s likely that this tool may not exactly suit your needs, or may be overkill for your use case.
> It may be worth considering alternatives such as [Vite] or [Parcel].

[Vite]: https://vitejs.dev/
[Parcel]: https://parceljs.org/

## Getting Started

Create a new project and start a local development environment:

```sh
$ pnpm dlx sku init my-app
$ cd my-app
$ pnpm start
```

By default, a new project's dependencies will be installed with the same package manager used to run `sku init`.
This can be overridden via the `--package-manager` flag:

```sh
$ pnpm dlx sku init --package-manager yarn my-app
$ cd my-app
$ yarn start
```

## [Documentation](https://seek-oss.github.io/sku)

## Contributing

Refer to [CONTRIBUTING.md](/CONTRIBUTING.md).
If you're planning to change the public API, please [open a new issue](https://github.com/seek-oss/sku/issues/new).

## License

MIT License
