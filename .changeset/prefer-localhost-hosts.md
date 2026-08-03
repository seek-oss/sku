---
'sku': patch
---

Prefer `*.localhost` for local development hosts.

- Missing `localhost` and `*.localhost` hosts no longer trigger hosts-file warnings; `sku setup-hosts` still writes `.localhost` entries when requested.
- `httpsDevServer` remains available for Safari and other cases that need local HTTPS.
