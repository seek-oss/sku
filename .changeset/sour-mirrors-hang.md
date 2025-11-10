---
'sku': minor
---

serve: `--list-urls, -l` flag is enabled on serve

Running `serve` would print every site host url to the console. This logic now aligns with `start|start-ssr` commands and will now only print the first available server url unless the `-l` flag is passed.

The service will still be available on all site hosts regardless of the passed flag. This change only affects terminal output.
