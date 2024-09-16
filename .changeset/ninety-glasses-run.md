---
'sku': patch
---

Reverts #1039

This change was causing a dependency to be cloned via `git` which may not be available in all CI envrionments.
