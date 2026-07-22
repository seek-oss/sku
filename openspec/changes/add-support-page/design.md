## Context

Drop the `/docs` URL prefix and add `/support` while keeping old links working.

## Decisions

- **Layout:** Use VitePress `srcDir: 'docs'` config to have all docs live under `site/docs/` yet have public URLs with no `/docs` prefix (`site/docs/support.md` → `/support`). Owned by `docs-site`.
- **FAQ:** Remove FAQ page; redirect `/faq` → `/support` by reusing old `docisfy-redirect` script, now `site/public/redirects.js`. Page-specific redirect owned by `support-page`.
- **Legacy URLs (`docs-site`):** Use the same script to map `/sku/docs/…` → `/sku/…`
