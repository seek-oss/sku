## 1. Support page

- [x] 1.1 Add `site/docs/support.md` at `/support` with SEEK-first notice, SEEK → `#sku-support`
- [x] 1.2 Replace the VitePress sidebar “FAQ” item with “Support” linking to `/support`

## 2. Remove FAQ; docs-site URL / redirects

- [x] 2.1 Remove the FAQ content page and redirect `/faq` → `/support` in `site/public/redirects.js` (expanded from the former docsify-redirect)
- [x] 2.2 Drop the `/docs` URL prefix (`srcDir: 'docs'`); redirect legacy `/sku/docs/…` → `/sku/…` and docsify hash routes to the new paths in the same script (`docs-site`)
- [x] 2.3 Update any in-repo links to `/docs/faq` or `/faq` to `/support`

## 3. Retarget current references

- [x] 3.1 Update live docs (`configuration`, `extra-features`, `vite`, others as found) so support links go to `/support` instead of Slack
- [x] 3.2 Update `CONTRIBUTING.md`, JSDoc, and runtime/warning copy that name `#sku-support` to point at the support page (absolute URL where needed)
- [x] 3.3 Confirm `packages/sku/CHANGELOG.md` and other historical release notes are left unchanged

## 4. Release notes

- [x] 4.1 Skip changeset — docs deploy separately; `sku` JSDoc/warning retargets can ship undocumented
