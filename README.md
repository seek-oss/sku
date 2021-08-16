[![npm](https://img.shields.io/npm/v/sku.svg?style=flat-square)](https://www.npmjs.com/package/sku)

<br />
<img src="docs/logo/logo.png?raw=true" alt="sku" title="sku" width="147" height="79" />
<br />

Front-end development toolkit, powered by [Webpack](https://webpack.js.org/), [Babel](https://babeljs.io/), [CSS Modules](https://github.com/css-modules/css-modules), [Less](http://lesscss.org/), [ESLint](http://eslint.org/), [Prettier](https://prettier.io/), [Jest](https://facebook.github.io/jest/), [Storybook](https://storybook.js.org/) and [Playroom](https://github.com/seek-oss/playroom).

Quickly get up and running with a zero-config development environment, or optionally add minimal config when needed. Designed for usage with [braid-design-system](https://github.com/seek-oss/braid-design-system), although this isn't a requirement.

This tool is heavily inspired by other work, most notably:

- [facebookincubator/create-react-app](https://github.com/facebookincubator/create-react-app)
- [insin/nwb](https://github.com/insin/nwb)
- [NYTimes/kyt](https://github.com/NYTimes/kyt)

**WARNING: While this software is open source, its primary purpose is to improve consistency, cross-team collaboration and code quality at SEEK. As a result, it’s likely that we will introduce more breaking API changes to this project than you’ll find in its alternatives.**

## Getting Started

Create a new project and start a local development environment:

```bash
$ npx sku init my-app
$ cd my-app
$ npm start
```

Don't have [npx](https://www.npmjs.com/package/npx)?

```bash
$ npm install -g npx
```

## [Documentation](https://seek-oss.github.io/sku)

## Contributing

Refer to [CONTRIBUTING.md](./CONTRIBUTING.md). If you're planning to change the public API, please [open a new issue](https://github.com/seek-oss/sku/issues/new) and follow the provided RFC template in the [GitHub issue template](.github/ISSUE_TEMPLATE.md).

## License

MIT License
