---
'sku': minor
---

Export a `Server` type for `sku`'s server entrypoint

**EXAMPLE USAGE**:

```tsx
// server.tsx
import { renderToString } from 'react-dom/server';
import type { Server } from 'sku';
import { App } from './App';

export default (): Server => ({
  renderCallback: ({ SkuProvider, getHeadTags, getBodyTags }, _req, res) => {
    const app = renderToString(
      <SkuProvider>
        <App />
      </SkuProvider>,
    );

    res.send(/* html */ `
      <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>My Awesome Project</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            ${getHeadTags()}
          </head>
          <body>
            <div id="app">${app}</div>
            ${getBodyTags()}
          </body>
       </html>`);
  },
});
```

> [!NOTE]
> The `Server` type may conflict with existing attempts in projects to define a `Server` type.
