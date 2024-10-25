---
'sku': patch
---

Improve error handling and messaging when opening the user's browser during the `start`, `start-ssr` and `serve` scripts

This fixes a macOS error where `sku` would crash when failing to detect the user's default browser. 
Instead, the user will be shown a warning message with instructions to enable the system permission required to fix the issue.
