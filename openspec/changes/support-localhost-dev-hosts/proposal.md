## Why

Platform guidance is shifting to recommend `*.localhost` for local development hostnames (automatic local resolution; secure context in most browsers). sku still treats every configured host as requiring an `/etc/hosts` entry, which makes the recommended pattern noisy and awkward. In-repo docs, fixtures, and tests still demonstrate `dev.*` / `*.local`, which undercuts the recommendation.

## What Changes

- Stop warning when a configured host ending in `.localhost` is missing from `/etc/hosts` (resolution is automatic). Exact `localhost` should also not warn.
- Keep writing `.localhost` hosts when `sku setup-hosts` is used (except exact `localhost`, which remains skipped as today).
- Leave `httpsDevServer` and other local HTTPS behaviour in place for Safari and other cases that still need local SSL.
- Update sku docs to describe `*.localhost` as the preferred local hostname pattern and document the new hosts-warning behaviour.
- Prefer `*.localhost` over `dev.*` / `*.local` in sku’s own docs examples, fixtures, and tests (including CONTRIBUTING host setup).

## Capabilities

### New Capabilities

- `local-dev-hosts`: Local development hostname behaviour — `/etc/hosts` warning exemptions for `*.localhost` / `localhost`, continued `setup-hosts` / `httpsDevServer` support, and `*.localhost` as the in-repo example pattern.

### Modified Capabilities

- (none)

## Impact

- `packages/sku` `checkHosts` / `setupHosts` and their tests.
- Config docs (`hosts`, `httpsDevServer`), multi-site / CLI hosts guidance, and CONTRIBUTING.
- Fixtures, browser/node tests, and test-host helpers that currently use `dev.*` / `*.local`.
- No removal of HTTPS options; runtime continues to accept non-`.localhost` hosts for consumer apps that have not migrated.
