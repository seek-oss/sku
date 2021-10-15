---
'sku': minor
---

Include node_modules in node builds

Previously, sku would only compile code within your src folder, plus any compile packages, for builds targetting the node environment. While this results in faster builds, it can sometimes lead to incorrect versions of packages being resolved due to clashing version range requirements. All node_modules will now included in the compilation by default, ensuring the correct package version is always required.

The old behaviour can be re-enabled via the new `externalizeNodeModules` config.