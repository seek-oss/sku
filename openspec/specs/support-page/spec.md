# Support Page

## Purpose

Canonical support guidance page for the sku docs site, with SEEK-first notice, contact routing, and `/faq` redirect.

## Requirements

### Requirement: Support page

The docs site SHALL publish `/support` (content file `site/docs/support.md` under VitePress `srcDir: 'docs'`) with a SEEK-first notice, `#sku-support` link for SEEK employees.
`/faq` MUST redirect to `/support`.
Current support / FAQ references SHOULD link to `/support` instead of Slack, `/faq`, or legacy `/docs/…` paths.

#### Scenario: Canonical support

- **WHEN** a reader opens `/support` or follows a current in-repo support link
- **THEN** they get the notice and contact routing on `/support`
- **AND** `/faq` takes them there too
- **AND** historical changelogs are left unchanged
