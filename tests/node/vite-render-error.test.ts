import { describe, it, expect } from 'vitest';

import { scopeToFixture, waitFor } from '@sku-private/testing-library';

const { sku } = scopeToFixture('vite-render-error');

describe('vite render error', () => {
  it('should emit a render error with the route name and stack trace', async () => {
    const build = await sku('build');

    await waitFor(() => {
      expect(build.hasExit()).toMatchObject({ exitCode: 1 });
    });

    const stderr = build.stderrArr.map((item) => item.contents).join('');

    expect(stderr).toMatchInlineSnapshot(`
      "Error rendering HTML for route /Error: Home page error
          at HomePage ({cwd}/fixtures/vite-render-error/src/HomePage.tsx:2:9)
          at renderWithHooks ({cwd}/node_modules/react-dom/cjs/react-dom-server-legacy.node.production.js:4196:18)
          at renderElement ({cwd}/node_modules/react-dom/cjs/react-dom-server-legacy.node.production.js:4334:14)
          at retryNode ({cwd}/node_modules/react-dom/cjs/react-dom-server-legacy.node.production.js:5040:16)
          at renderNodeDestructive ({cwd}/node_modules/react-dom/cjs/react-dom-server-legacy.node.production.js:4843:7)
          at finishFunctionComponent ({cwd}/node_modules/react-dom/cjs/react-dom-server-legacy.node.production.js:4237:9)
          at renderElement ({cwd}/node_modules/react-dom/cjs/react-dom-server-legacy.node.production.js:4336:7)
          at retryNode ({cwd}/node_modules/react-dom/cjs/react-dom-server-legacy.node.production.js:5040:16)
          at renderNodeDestructive ({cwd}/node_modules/react-dom/cjs/react-dom-server-legacy.node.production.js:4843:7)
          at renderElement ({cwd}/node_modules/react-dom/cjs/react-dom-server-legacy.node.production.js:4777:11)"
    `);
  });
});
