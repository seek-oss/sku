---
'sku': patch
---

Warn if pnpm virtual store is found when another package manager in use

When a `pnpm` virtual store directory (`node_modules/.pnpm`) is detected but a different package manager (such as npm or yarn) is in use, a warning will now be printed, but the build will continue.

**Note:** This behavior is only temporary and is *not recommended*; mixing package managers in a project can cause unexpected issues. Please migrate to a consistent package manager as soon as possible. This warning may become a hard error in a future release.

