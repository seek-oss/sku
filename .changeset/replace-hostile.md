---
'sku': patch
---

`setup-hosts`: Append missing entries to the hosts file instead of rewriting it

Existing lines, including comments and whitespace, are no longer modified. `setup-hosts` now also warns when a host is already mapped to a different IP address, as that entry may take precedence.

The `hostile` dependency has been removed.
