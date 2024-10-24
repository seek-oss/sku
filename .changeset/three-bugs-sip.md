---
'sku': patch
---

Improve error handling and messaging in `start` script.

This fixes a macOS error when the user's terminal application's Finder automation permissions were disabled, which caused an error when trying to detect the user's default browser.
This change provides instructions to resolve the system permission issue and prevents script failure.
