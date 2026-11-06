---
'sku': patch
---

Managed Data Mode SSR: Run the language chunk and route modules before hydrating in production

Previously the production client only preloaded the Vocab language chunk and never ran it, so translated pages hydrated without their messages and threw React error #418.
The client now imports every module the server rendered the page with before calling `hydrateRoot`.
