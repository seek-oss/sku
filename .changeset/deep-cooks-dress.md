---
'@sku-lib/vitest': minor
---

Disable Vitest globals

`vitest` is now a peer dependency. As such, `vitest` APIs must now be imported explicitly

**EXAMPLE USAGE**:
```ts
// example.test.ts
import { describe, it, expect } from 'vitest';

describe("test suite", () => {
  it("should be true" () => {
    expect(true).toBe(true);
  });
});
```
