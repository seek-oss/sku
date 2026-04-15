---
'sku': minor
---

`vite`: Improve error messaging during `sku build`

The path of the first route that fails to render will now be logged, along with a stack trace to aid debugging. Errors that occur before rendering will also now be logged with a stack trace.
