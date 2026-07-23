## Why

sku is open source and publicly documented, so non-SEEK readers can encounter support pointers that currently link to SEEK Slack (`#sku-support`).
We should have a central support page to direct users to, to avoid having to preface every link with "if you are a SEEK employee".
The existing FAQ page is already support-oriented rather than a true FAQ, so it should fold into that page.
As we look to add a new page, especially one that will be linked within code we should also optimise our URL structure to remove the unnecessary `/docs` prefix.

## What Changes

- Add a dedicated docs site page at `/support` (`site/docs/support.md` under VitePress `srcDir: 'docs'`) that:
  - Opens with a notice based on the README warning (open source, but primary purpose is SEEK)
  - Directs SEEK employees to the `#sku-support` Slack channel (with the existing public channel URL)
  - Includes the troubleshooting guidance currently on the FAQ page (common dependency clashes)
- Remove `site/docs/faq.md` as a content page and redirect `/faq` to `/support`
- Drop the `/docs` URL prefix site-wide; expand the client redirects script (from the former docsify-redirect) so legacy `/docs/…` and docsify hash routes map to the new paths
- Update live docs, contributing notes, codegen templates, and JSDoc/runtime copy that currently point at `#sku-support` / Slack archives so they link to `/support` instead
- Leave historical release notes (`packages/sku/CHANGELOG.md` and similar archived changelogs) unchanged

## Capabilities

### New Capabilities

- `support-page`: Canonical support guidance page (README-based SEEK-first notice, contact routing, FAQ troubleshooting content) plus `/faq` → `/support` redirect and the convention that current project references to sku support link to that page rather than Slack directly
- `docs-site`: Docs site URL shape without a `/docs` prefix; client redirects from legacy `/sku/docs/…` paths and former docsify hash routes to the current links

### Modified Capabilities

- (none)

## Impact

- **Docs site**: New `site/docs/support.md` at `/support`; sidebar “Support” replaces “FAQ”; FAQ content moved; `/faq` redirects to `/support`
- **Docs redirects**: `site/public/redirects.js` maps `/sku/docs/…` → `/sku/…` and docsify hash routes to current paths
- **Repo docs**: `CONTRIBUTING.md` and any other non-changelog markdown that deep-links Slack
- **Code / templates**: JSDoc in `packages/sku` types; user-facing CLI/warning strings that name `#sku-support`
- **Out of scope**: Editing old release notes / CHANGELOG history; changing Slack channel membership or policies
- **Breaking**: Old `/faq` and `/docs/faq` URLs continue via redirect; Slack remains available for SEEK via the support page
