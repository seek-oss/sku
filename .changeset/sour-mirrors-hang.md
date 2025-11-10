---
'sku': minor
---

serve: Add support for the `--list-urls, -l` flag

Previously, `serve` printed every site's URL to the console. This logic now aligns with the behaviour of the `start|start-ssr` commands - only printing the first available server URL unless the `-l` flag is passed.

The service will still be available on all site hosts regardless of the passed flag. This change only affects terminal output.
