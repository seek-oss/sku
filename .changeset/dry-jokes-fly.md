---
'sku': major
---

Remove workaround for `classnames` package issue

A workaround for [a bug in the `classnames`][bug] package has been removed now that the bug has been fixed.

Please evaluate whether you need to use `classnames` library in your app.
Prefer using [Braid's `Box` component, which supports the full `clsx` API][box], instead.
If you need to construct class name strings for components other than `Box`, prefer [the `clsx` package][clsx] over the `classnames` package.

[bug]: https://github.com/JedWatson/classnames/issues/240
[box]: https://seek-oss.github.io/braid-design-system/components/Box/#dynamic-css-classes
[clsx]: https://github.com/lukeed/clsx
