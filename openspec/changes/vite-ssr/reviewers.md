## Reviewers guide

Recommended review order: **Proposal → Docs → Design → Specs → fixtures → implementation**.

OpenSpec reviewing tips: [Reviewing Changes](https://openspec.dev/docs/reviewing-changes).

### 1. Contract (read first)

1. [Proposal](https://github.com/seek-oss/sku/blob/vite-ssr-impl/openspec/changes/vite-ssr/proposal.md) — why, scope, impact
2. [Design](https://github.com/seek-oss/sku/blob/vite-ssr-impl/openspec/changes/vite-ssr/design.md) — decisions and non-goals
3. Specs (living requirements):
   - [managed-data-mode](https://github.com/seek-oss/sku/blob/vite-ssr-impl/openspec/changes/vite-ssr/specs/managed-data-mode/spec.md)
   - [ssr](https://github.com/seek-oss/sku/blob/vite-ssr-impl/openspec/changes/vite-ssr/specs/ssr/spec.md)
   - [csp](https://github.com/seek-oss/sku/blob/vite-ssr-impl/openspec/changes/vite-ssr/specs/csp/spec.md)

Spec PRs for context: #1670, #1686.

### 2. Try it before deep-diving code (recommended)

Branch packages are published under the `vite-ssr-impl` npm dist-tag.

**Scaffold a new app** (preferred — uses `@sku-lib/create`, not `sku create`):

```bash
pnpm dlx @sku-lib/create@vite-ssr-impl my-ssr-app --template ssr
cd my-ssr-app
pnpm start
```

Or install create locally, then run its bin:

```bash
pnpm add -D @sku-lib/create@vite-ssr-impl
pnpm exec create-sku my-ssr-app --template ssr
```

Then set `bundler: 'vite'` + `buildType: 'ssr'` and follow:

- [Getting started](https://github.com/seek-oss/sku/blob/vite-ssr-impl/site/docs/ssr/index.md)
- [Migrate from webpack SSR](https://github.com/seek-oss/sku/blob/vite-ssr-impl/site/docs/ssr/migrate-from-webpack-ssr.md)
- [Migrate from static](https://github.com/seek-oss/sku/blob/vite-ssr-impl/site/docs/ssr/migrate-from-static-app.md)

### 3. Implementation chapters

We recommend focusing on reviewing the chapters that match your concern. Suggested order for a full pass:

| #   | Chapter           | What to read                                                                                                     |
| --- | ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | Public API        | `packages/sku/src/services/vite/ssr/types.ts`, `defineEntry.ts`, `packages/sku/src/runtime.ts`, `skuContext.tsx` |
| 2   | Request path      | `streamDocument.tsx`, `render.tsx`, `ssrServerShared.ts`, `bootstrap.ts`                                         |
| 3   | Routes / sites    | `buildSiteRouteTrees.ts`, `entries/ssr-client.tsx`, `entries/ssr-server.tsx`, `plugins/ssr.ts`                   |
| 4   | Dev / prod wiring | `createDevSsrServer.ts`, `startProductionSsrServer.ts`, `validateConfig.ts`                                      |
| 5   | Seams             | `csp.ts`, `insertHtml.tsx`, `createInsertHtmlTransform.ts`, `resolveAssets.ts`, baked client manifest            |
| 6   | Proof             | `tests/browser/*ssr*`, `fixtures/ssr-*`, `fixtures/stream-insert-html`                                           |
| 7   | Adoption          | `site/docs/ssr/*`, `packages/create/templates/ssr`                                                               |

**Noise / skim:** `pnpm-lock.yaml`, create snapshots, fixture page chrome unless you are reviewing that chapter.

### 4. Split review by expertise (optional)

- **API / types / DX** — chapters 1 + 7
- **Streaming / server lifecycle** — chapters 2–4
- **CSP / assets / deploy** — chapter 5 + [deploy-to-production](https://github.com/seek-oss/sku/blob/vite-ssr-impl/site/docs/ssr/deploy-to-production.md)
- **Behaviour proof** — chapter 6

### 5. Done when

- [ ] Proposal / design / specs agree with the shipped public contract
- [ ] Scaffold or migrate path above runs (`pnpm start`)
- [ ] Your chapter(s) reviewed against the matching OpenSpec requirements
- [ ] Experimental / not-for-production warnings and changeset wording look correct
