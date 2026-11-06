---
'sku': minor
---

Vite SSR: `sku build` bundles dependencies into `dist/server`, so the production server starts with `node server.mjs` without `node_modules`

The server entry is now `dist/server/server.mjs` (previously `dist/server/server.js`), and its chunks use the `.chunk.mjs` extension, so Node always loads them as ES modules regardless of any `package.json` they are deployed under.
Update any deploy or start scripts that run `node dist/server/server.js`.
