---
'sku': major
---

`configure`: Deprecate CommonJS `module.exports` format for sku configs

`sku` now checks the format of your sku config when configuring your project. If the config uses the unsupported CommonJS `module.exports` format, `sku` displays a banner and exits. Convert your config to ESM using `export default` to resolve this.
