---
'sku': major
---

`deps`: Update `path-to-regexp` dependency from `^6.3.0` to `8.4.2`

This update spans two major versions. Please read the release notes for both [v7] and [v8].

**BREAKING CHANGE**:

The change most likely to impact `sku` consumers is the requirement that [wildcards] (`*`) now must specify a key name, just like [path parameters] (`:`). In most cases this should be a simple migration: `/home/*` -> `/home/*rest`.

It is _highly recommended_ to review all routes configured in your application and test navigation to these routes to ensure they still function as expected.

[v7]: https://github.com/pillarjs/path-to-regexp/releases/tag/v7.0.0
[v8]: https://github.com/pillarjs/path-to-regexp/releases/tag/v8.0.0
[wildcards]: https://github.com/pillarjs/path-to-regexp#wildcard
[path parameters]: https://github.com/pillarjs/path-to-regexp#parameters
