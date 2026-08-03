## 1. Hosts check exemptions

- [x] 1.1 Skip `checkHosts` warnings for exact `localhost` and hosts ending in `.localhost`
- [x] 1.2 Confirm `setupHosts` still writes `.localhost` hosts and still skips exact `localhost`
- [x] 1.3 Add/update unit tests in `hosts.test.ts` for warning skip and setup write behaviour

## 2. Prefer .localhost in examples and tests

- [x] 2.1 Replace `dev.*` / `*.local` hostnames with `*.localhost` in fixtures, unit/integration tests, and test-host helpers
- [x] 2.2 Update docs examples and CONTRIBUTING host setup to demonstrate `*.localhost`

## 3. Docs and release notes

- [x] 3.1 Document the `.localhost` warning exemption and preferred `*.localhost` pattern in configuration / multi-site / CLI docs; note `httpsDevServer` remains for Safari and similar needs
- [x] 3.2 Add a changeset describing the behaviour change
