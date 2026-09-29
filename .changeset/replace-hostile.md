---
'sku': patch
---

`setup-hosts`: Append missing entries to the hosts file instead of rewriting it

`setup-hosts` no longer changes existing lines in the hosts file, including comments and whitespace. It also warns when the hosts file already maps a host to a different IP address, because that entry may take precedence.

sku no longer depends on `hostile`.
