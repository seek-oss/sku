---
'sku': major
---

Remove `pre-commit` command

The `pre-commit` command saw very little use and bundled `lint-staged` (and its many transitive dependencies) into every `sku` install. Setting this up yourself is straightforward and gives you full control over which commands run before each commit.

Sku's pre-commit hook documentation has been updated to support projects wanting to continue using this feature. See the [pre-commit hook documentation](https://seek-oss.github.io/sku/#/./docs/extra-features?id=pre-commit-hook) for a full  migration guide.
