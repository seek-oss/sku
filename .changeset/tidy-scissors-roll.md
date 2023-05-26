---
'sku': major
---

Require Node.js 18.12+

**BREAKING CHANGE**

Node 14 has already reached end of life as of April 2023, and Node.js 16 had its end of life date [brought forward to September 2023][node 16 eol], so in the interest of preventing another breaking change in 4 months time, we're pre-emptively dropping support for Node.js 16 in addition to Node.js 14.
We've chosen to support Node.js versions from v18.12 onwards as this version was the first [Node.js 18 LTS release][node 18.12 release].

Consider upgrading the Node.js version for your project across:

- `.nvmrc`
- `package.json#/engines/node`
- `@types/node` package version
- CI/CD configuration (`.buildkite/pipeline.yml`, `Dockerfile`, etc.)

[node 16 eol]: https://nodejs.org/en/blog/announcements/nodejs16-eol
[node 18.12 release]: https://nodejs.org/en/blog/release/v18.12.0
