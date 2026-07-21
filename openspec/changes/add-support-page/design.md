## Context

Support pointers deep-link SEEK Slack; FAQ is already a mini support page.
Add one `/support` link and fold FAQ into it.
While doing so, drop the `/docs` URL prefix so links (including those from code) stay short.

## Goals / Non-Goals

**Goals:** `/support` with README notice → GitHub Issues → `#sku-support` → FAQ troubleshooting; redirect `/faq`; drop `/docs` URL prefix with client redirects for legacy paths; retarget live links; sidebar Support replaces FAQ.

**Non-Goals:** Editing changelogs; Slack policy changes; expanding troubleshooting beyond the current FAQ.

## Decisions

- **Layout:** VitePress `srcDir: 'docs'` — all content under `site/docs/`; public URLs have no `/docs` prefix (`site/docs/support.md` → `/support`). Owned by `docs-site`.
- **Content:** README warning (same meaning/tone), then non-SEEK Issues, then SEEK Slack (`https://seekchat.slack.com/channels/sku-support`), then former FAQ tips. Owned by `support-page`.
- **FAQ:** Remove content page; redirect `/faq` → `/support` in `site/public/redirects.js`; sidebar “Support”. Page-specific redirect owned by `support-page`.
- **Legacy URLs (`docs-site`):** Same script maps `/sku/docs/…` → `/sku/…` (including `/sku/docs` → `/sku/`) and docsify hash routes on `/sku` / `/sku/` (e.g. `#/./docs/vite?id=foo`, stripping a leading `docs/`) to the new links.
- **Links:** VitePress → `/support`; absolute/JSDoc/templates → `https://seek-oss.github.io/sku/support`. Skip `CHANGELOG.md`.

## Risks / Trade-offs

Bookmarks to `/faq` or `/docs/faq` → covered by client redirects (`support-page` + `docs-site`).
Incomplete link sweep → grep `sku-support`, `docs/faq`, `/docs/`, Slack ids; skip changelogs.
