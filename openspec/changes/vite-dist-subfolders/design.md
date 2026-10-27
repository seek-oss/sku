## Context

Vite output locations come from one helper, `createOutDir(target)`. It maps the Vite client build to `target` (static) or `target/client` (SSR), the SSR server build to `target/server`, and the prerender bundle to `target/render`. HTML is written by the prerender worker relative to `target`. Webpack writes assets and HTML to `target` through its own output config and plugins. Webpack SSR (`sku build-ssr`) writes client assets, `webpackStats.json` (loadable stats) and the server bundle to `target`; the server bundle requires `./webpackStats.json` at runtime.

`sku serve` is bundler-agnostic. Webpack SSG and Vite SSG both go through it, using `serve-handler` with a single `public` root.

See `proposal.md` for motivation and the `dist-subfolders` delta spec for requirements.

## Goals / Non-Goals

**Goals:**

- One layout switch that every build path writing `dist` reads, so Vite, webpack, webpack SSR and `sku serve` cannot disagree.
- Zero behaviour change for any build with `distSubfolders` off.
- Naming: variables and properties that hold these directories are prefixed with `dist` (`distClient`, `distRendered`, `distServer`).

**Non-Goals:**

- Requiring changes to deployment tools, or detecting the layout from disk at build time.
- Changing SSR output, which is already `client/` and `server/`.

## Decisions

### Layout-aware `createOutDir`

`createOutDir` takes whether subfolders are in use and returns `distClient`, `distRendered` and `distServer` alongside the existing `ssg` and `join`.

| Mode                | `distClient`    | `distRendered`    |
| ------------------- | --------------- | ----------------- |
| Static, option off  | `target`        | `target`          |
| Static, option on   | `target/client` | `target/rendered` |
| SSR (option unused) | `target/client` | not used          |

SSR's server build keeps writing to `target/server`, now exposed as `distServer`.

The resolved boolean lives on `skuContext.distSubfolders` (the config value for static builds; always `false` for SSR, where it is rejected). The old `client`, `ssrClient` and `ssr` keys are replaced by `distClient` and `distServer`, so unconverted call sites fail type-checking.

Alternative: a separate `createOutDir` per mode. Rejected because callers (prerender worker, plugins, serve) would each need to pick one.

### Webpack follows the same switch

With the option on, webpack's output path for assets becomes `distClient`, and HTML and metadata are emitted relative to `distRendered`. `public/` files are copied to `distClient`. The helper is shared with Vite so both bundlers resolve the same directories.

### Webpack SSR follows the same switch

With the option on, `sku build-ssr` sets the client `output.path` to `distClient` and the server `output.path` to `distServer`. `LoadablePlugin` writes the stats directly into `distServer` (via `writeToDisk.filename`), so the server bundle's `./webpackStats.json` external still resolves and the stats aren't deployed with client assets. `public/` files are copied to `distClient`.

The production webpack SSR server has no static mount, so nothing else changes at runtime. The dev server (`sku start-ssr`) keeps its current layout.

Alternative: move the stats into `server/` after the build, as Vite SSR does with its manifest. Rejected because writing them in place is simpler and leaves no window where they sit in `client/`.

### Clean the target explicitly for static subfolder builds

With the option off, the build writes to `target`, so the default clean clears everything. With the option on only `client/` is cleared by the bundler, so a stale `rendered/` (or a stale `render/`) would survive. The static build handler therefore cleans the target before building when the option is on.

### Prerender and cleanup follow `createOutDir`

- Prerender writes HTML relative to `distRendered` and reads the Vite manifest from `distClient`.
- Post-build cleanup removes the manifest directory from `distClient` and `render/` from the target.
- Public files are copied to `distClient`.

### Validation lives in `validateConfig`

The rejection of `distSubfolders` with SSR goes through `validateConfig`, next to the existing SSR option checks. The reserved environment names (`client`, `rendered`, `server`) are rejected unconditionally: this keeps validation simple, and no known consumer uses these names.

The public-HTML check runs at the start of each static build handler (Vite and webpack), before the bundler runs, so it fails fast. It matches `/\.html$/i`.

### `sku serve` keeps `serve-handler`

Replacing it with `express.static` would change serving for webpack SSG too. Instead, when the layout is subfolders:

- Route rewrites target `rendered/<env>/<site>/<route>/index.html`.
- Metadata is globbed under `rendered/`, and header `source` paths gain the `rendered/` prefix.
- Requests under `publicPath` that match a file in `client/` are served by a second `serve-handler` call rooted at `client/`. `serve-handler` rewrites URL-encode slashes in the destination, so a `publicPath/**` to `client/**` rewrite cannot reach nested files. Anything that is not an existing client file falls through to the rendered handler and its route rewrites.

## Risks / Trade-offs

- [`serve-handler` may match headers before or after rewriting] → Cover with a `sku serve` test that asserts a CSP header-delivered route in the subfolder layout.
- [Client file lookup could shadow routes when `publicPath` is `/`] → Only existing files in `client/` are served from there, so routes without a matching file still resolve to rendered documents. Test a route plus an asset under `publicPath: '/'`.
- [Custom `transformOutputPath` can drop the environment segment] → Out of scope. It is an escape hatch with no validation.
- [Always reserving `client`, `rendered` and `server` breaks an app using one as an environment name] → Accepted as an edge case with no known consumers.
