---
'sku': minor
---

Bump webpack to ^5.106.1 to fix `ReferenceError: __WEBPACK_DEFAULT_EXPORT__ is not defined` caused by a regression in webpack@5.106.0 affecting `export default () => {}` arrow function components.
