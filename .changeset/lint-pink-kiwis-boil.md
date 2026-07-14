---
'sku': minor
---

`lint`: Run all lint checks instead of bailing on the first failure

Previously, a single failing lint check would halt the entire process, so you'd only see errors from the first check to fail and would have to fix them before any other errors surfaced.

To surface everything at once, `sku` now runs all lint checks even when some fail. You'll see errors from every check in a single run, and the process still exits with a non-zero code if any errors are found.
