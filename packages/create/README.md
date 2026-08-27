# `@sku-lib/create`

Create new [sku](https://github.com/seek-oss/sku) projects.

```sh
pnpm dlx @sku-lib/create my-app
```

## Templates

| Template | Flag                 | Notes                                                                                                                         |
| -------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Vite     | `--template vite`    | Static / SSG app (default interactive choice). Vite + Vitest.                                                                 |
| SSR      | `--template ssr`     | Server-rendered Managed Data Mode app (`buildType: 'ssr'`). Experimental — not for production. Use `sku start` / `sku build`. |
| Webpack  | `--template webpack` | Legacy static / SSG app. Webpack + Jest.                                                                                      |

```sh
pnpm dlx @sku-lib/create my-app --template ssr
cd my-app
pnpm start
```

See [Getting started](https://seek-oss.github.io/sku/#/./docs/getting-started) and [Server rendering](https://seek-oss.github.io/sku/#/./docs/server-rendering).
