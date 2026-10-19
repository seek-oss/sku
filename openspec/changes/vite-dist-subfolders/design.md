## Context

Vite output locations come from one helper, `createOutDir(target)`. It maps the Vite client build to `target` (static) or `target/client` (SSR), the SSR server build to `target/server`, and the prerender bundle to `target/render`. HTML is written by the prerender worker relative to `target`.

`sku serve` is bundler-agnostic. Webpack SSG and Vite SSG both go through it, using `serve-handler` with a single `public` root.

See `proposal.md` for motivation and the `static-output-layout` and `ssr` delta specs for requirements.

## Goals / Non-Goals

**Goals:**

- One layout switch that every Vite path reads, so static, SSR and `sku serve` cannot disagree.
- Zero behaviour change for webpack and for Vite static with the option off.

**Non-Goals:**

- Any changes to our deployment tool or detection of the layout from disk at build time.

## Decisions

### Layout-aware `createOutDir`

`createOutDir` takes whether subfolders are in use and returns `documents` and `resources` alongside the existing `ssr`, `ssg` and `join`.

| Mode | `resources` | `documents` |
| --- | --- | --- |
| Static, option off | `target` | `target` |
| Static, option on | `target/resources` | `target/documents` |
| SSR (always) | `target/resources` | not used |

The resolved boolean lives on `skuContext` (true for Vite SSR, or Vite static with the option on). The old `client` and `ssrClient` keys are replaced by `resources`, so unconverted call sites fail type-checking.

Alternative: a separate `createOutDir` per mode. Rejected because callers (prerender worker, plugins, serve) would each need to pick one.

### Clean the target explicitly for static subfolder builds

With the option off, Vite's client build writes to `target`, so its default `emptyOutDir` clears everything. With the option on it only clears `resources/`, so a stale `documents/` (or a stale `render/`) would survive. The static build handler therefore cleans the target before building when the option is on, as the SSR handler already does.

### Prerender and cleanup follow `createOutDir`

- Prerender writes HTML relative to `outDir.documents` and reads the Vite manifest from `outDir.resources`.
- Post-build cleanup removes the manifest directory from `outDir.resources` and `render/` from the target.
- Public files are copied to `outDir.resources`.

### Validation lives in `validateConfig`

The new option's rejections (webpack, SSR) and the reserved `resources` environment name go through `validateConfig`, next to the existing SSR option checks. The reserved-name check only runs when the option is on, so existing webpack apps are unaffected.

The public-HTML check runs at the start of the Vite static build handler, before `createBuilder`, so it fails fast. It matches `/\.html$/i`, the same pattern our deployment tool excludes in its legacy mode.

### `sku serve` keeps `serve-handler`

Replacing it with `express.static` would change serving for webpack SSG too. Instead, when the layout is subfolders:

- Route rewrites target `documents/<env>/<site>/<route>/index.html`.
- Metadata is globbed under `documents/`, and header `source` paths gain the `documents/` prefix.
- A final rewrite maps `publicPath/**` to `resources/**`. It comes after all route rewrites so routes win. The existing "`publicPath` is not `/`" rewrite is folded into this one.

### SSR production server

`startProductionSsrServer` resolves the optional static directory from sibling `resources/` instead of `client/`. The manifest move into `server/` is unchanged apart from reading from `outDir.resources`.

## Risks / Trade-offs

- [`serve-handler` may match headers before or after rewriting] → Cover with a `sku serve` test that asserts a CSP header-delivered route in the subfolder layout.
- [A catch-all `publicPath/**` rewrite could shadow routes when `publicPath` is `/`] → Order rewrites so route rewrites come first, and test a route plus an asset under `publicPath: '/'`.
- [Custom `transformOutputPath` can drop the environment segment] → Out of scope. It is an escape hatch with no validation.
- [Renaming `client/` breaks the experimental SSR deploy contract] → Accepted, since there are no production SSR consumers. Called out in the changeset.
