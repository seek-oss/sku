---
'sku': patch
---

Improve error handling and messaging when opening the user's browser during the `start`, `start-ssr` and `serve` scripts

This fixes a macOS error when the user's terminal application's Finder automation permissions were disabled, which caused an error when trying to detect the user's default browser.
This change provides instructions to resolve the system permission issue and prevents script failure.
