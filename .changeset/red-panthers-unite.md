---
'sku': patch
---

Makes some more of the array types in the sku config type into readonly versions.
This allows for arrays that have been declared with `as const` to be passed in.

Effected fields are `sites`, `sites[].routes`, `site[].languages`, `routes`, and `routes[].languages`.