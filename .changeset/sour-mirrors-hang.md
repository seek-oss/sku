---
'sku': minor
---

serve: `--list-urls, -l` flag is enabled on serve

Running `serve` would print every host url to the console. This logic now aligns with `start|start-ssr` commands and will now only print the first available server url unless the `-l` flag is passes.

All the servers will still be started regardless of the passed flag. This change only affects terminal output.
