# @sku-lib/rolldown-plugin-unassert

This is a [Rolldown](https://rolldown.rs) and [Vite](https://vite.dev) plugin that removes assertions at build time.
It is a port of [babel-plugin-unassert](https://github.com/unassert-js/babel-plugin-unassert) to the [oxc](https://oxc.rs) toolchain.

```js
// vite.config.js
import { unassert } from '@sku-lib/rolldown-plugin-unassert';

export default {
  plugins: [unassert()],
};
```

It removes the same patterns as `babel-plugin-unassert`:

```js
import assert from 'node:assert'; // removed
const assert = require('assert').strict; // removed

function add(a, b) {
  console.assert(typeof a === 'number'); // removed
  assert(!isNaN(a)); // removed
  assert.equal(typeof b, 'number'); // removed
  return a + b;
}
```

See the [babel-plugin-unassert README](https://github.com/unassert-js/babel-plugin-unassert#supported-patterns) for the full list.

## Options

```js
unassert({
  // The same options as `babel-plugin-unassert`. If you set one, it replaces its default.
  variables: ['assert'],
  modules: ['assert', 'power-assert', 'node:assert'],

  // Options for Rolldown only.
  include: /\.[cm]?[jt]sx?(?:$|\?)/, // IDs of the modules to transform
  exclude: undefined, // IDs of the modules to skip (by default, the plugin transforms dependencies)
  sourcemap: true, // the plugin skips source maps in Vite builds with `build.sourcemap: false`
  rawTransfer: true, // use oxc-parser's experimental raw transfer where supported
});
```

The package also exports the transform function on its own:

```js
import { transform } from '@sku-lib/rolldown-plugin-unassert';

const result = transform(code, 'file.ts', { variables: ['invariant'] }); // { code, map } | null
```

## Compatibility with babel-plugin-unassert

The plugin applies the removal hooks of Babel.
These hooks change the parent when an assertion is not in a statement list.
For example, `if (a) assert(x);` becomes `if (a) {}`, and Babel removes an `else assert(x)` branch.

Differences:

- The plugin keeps formatting and comments, because it edits the source and does not print it again.
- A removal can replace a parent expression with the remaining sibling.
  The plugin then always checks that sibling again in its new position.
  Babel does this for `||` and `&&`, but not for sequence expressions.
  Thus Babel does not remove `assert(x)` in `(assert = require('assert'), assert(x));`.
  This plugin removes it.
- If the code contains a construct that `babel-plugin-unassert` cannot handle, this plugin does not change the code.
  This applies to `import 'assert'` and to `require()` with no arguments.
  It also applies to removals that Babel cannot do, such as `x = (assert = require('assert'))`.
- The plugin looks for search terms before it parses a file.
  A search term is the root of a configured variable name, `assert` (for `console.assert`), or a backslash.
  A backslash is a search term because an escape sequence such as `'\x61ssert'` can spell a name.
  The `code` hook filter of Rolldown skips files that contain no search term, so the plugin does not parse them.
  In a parsed file, the plugin does not walk subtrees whose source contains no search term.
- The plugin does not generate source maps in a Vite build that does not emit them (`build.sourcemap: false`).
  Source maps cause most of the cost of the plugin.
  The plugin always generates source maps in the dev server, for all other `build.sourcemap` values, and outside Vite.

## Benchmarks

See [the benchmarks README](./benchmark/README.md) for a comparison between this plugin and the original `babel-plugin-unassert`.
