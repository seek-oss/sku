## Context

Platform guidance is moving toward `*.localhost` for local development (automatic resolution via the OS/browser; secure context in most browsers). sku today:

- Warns on `start` / `start-ssr` / `serve` for any configured host missing from `/etc/hosts`, with no exemption for `*.localhost` (or even exact `localhost` on the warning path).
- Still needs `httpsDevServer` for Safari and other secure-context cases; that path stays.
- Documents and tests `dev.*` / `*.local` hostnames in multi-site examples, fixtures, and CONTRIBUTING.

This change is sku-only. Related platform hostname handling outside this repo is tracked separately.

## Goals / Non-Goals

**Goals:**

- Prefer `*.localhost` without false `/etc/hosts` warnings.
- Keep `setup-hosts` able to write `.localhost` entries for teams that want them.
- Keep HTTPS / `httpsDevServer` available.
- Document the recommendation and new behaviour in sku docs.
- Migrate in-repo docs examples, fixtures, tests, and CONTRIBUTING host lists from `dev.*` / `*.local` to `*.localhost`.

**Non-Goals:**

- Removing `httpsDevServer`, cert generation, or Vite/webpack HTTPS paths.
- Forcing consumer apps outside this repo to migrate off `dev.*` / `*.local` (those patterns keep working at runtime).
- Changing how the dev server binds or which hosts are in `allowedHosts` beyond warning behaviour.
- Adding DNS/mDNS or custom resolvers inside sku.
- Updating historical changelog entries that mention old host patterns.

## Decisions

### 1. Warning exemption: hosts that end with `.localhost`, plus exact `localhost`

**Choice:** `checkHosts` skips warning for `localhost` and any host whose hostname ends with `.localhost` (case-insensitive). Other missing hosts still warn and suggest `sudo sku setup-hosts`.

**Alternatives considered:**

- Skip only when the TLD is exactly `localhost` via URL parsing — overkill for bare host strings from config.
- Also skip `.local` — out of scope; `.local` remains a legacy pattern that still needs hosts entries.

**Rationale:** Matches automatic resolution for the reserved `.localhost` special-use domain and aligns warn vs write for bare `localhost`.

### 2. `setup-hosts` still writes `.localhost` (except exact `localhost`)

**Choice:** No change to write filtering beyond existing skip of exact `localhost`. Teams can still opt into `/etc/hosts` entries.

**Rationale:** Explicitly requested by the RFC; harmless if redundant with automatic resolution.

### 3. Docs recommend `*.localhost`; HTTPS stays documented

**Choice:** Update `hosts`, multi-site, and CLI docs. Note that Safari may still need `httpsDevServer` for secure-context APIs.

**Rationale:** Behaviour change without guidance would strand adopters; HTTPS remains a supported escape hatch.

### 4. In-repo examples and tests use `*.localhost`

**Choice:** Replace `dev.*` / `*.local` hostnames in docs examples, fixtures, unit/integration tests, test-host helpers, and CONTRIBUTING with equivalent `*.localhost` names (e.g. `dev.seek.com.au` → `au.seek.com.localhost`). Keep at least one test that a non-`.localhost` missing host still warns.

**Alternatives considered:**

- Docs-only recommendation — leaves sku’s own suite teaching the old patterns.
- Leave fixtures on `dev.*` “because CI already has hosts” — fights the migration story; `*.localhost` should not need those entries.

**Rationale:** sku should demonstrate the recommended pattern everywhere consumers look for examples.

## Risks / Trade-offs

- [Teams on Safari still need HTTPS] → Mitigation: do not remove `httpsDevServer`; call out in docs.
- [Some environments may not resolve `*.localhost` as expected] → Mitigation: keep `setup-hosts` writing those names; continue warning for non-`.localhost` hosts.
- [CI or local setup still depends on `/etc/hosts` for old `dev.*` names] → Mitigation: update `setupTestHosts` / CONTRIBUTING together with fixtures; prefer names that resolve without hosts entries.

## Migration Plan

1. Land code + tests for `checkHosts`.
2. Migrate in-repo host examples/fixtures/tests to `*.localhost`; update CONTRIBUTING.
3. Update docs; add a changeset noting the behaviour change (non-breaking: fewer warnings + example migration).
4. Consumer apps using `*.local` / `dev.*` keep working; they can adopt `*.localhost` when ready.
5. Rollback: revert the change; no data migration.

## Open Questions

- None blocking for sku.
