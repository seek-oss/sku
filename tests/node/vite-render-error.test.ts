import { describe, it, expect } from 'vitest';

import { scopeToFixture, waitFor } from '@sku-private/testing-library';

const { sku } = scopeToFixture('vite-render-error');

describe('vite render error', () => {
  it('should emit an error with the route name and stack trace when a route fails to render', async () => {
    const build = await sku('build');

    await waitFor(() => {
      expect(build.hasExit()).toMatchObject({ exitCode: 1 });
    });

    const stderr = build.stderrArr.map((item) => item.contents).join('\n');

    expect(stderr).toMatchInlineSnapshot(`
      "Error rendering HTML for route "/"
      Error: Home page error
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

  it('should emit an error with a stack trace when the render entrypoint throws an error', async () => {
    const build = await sku('build', ['--config', 'sku.config.renderError.ts']);

    await waitFor(() => {
      expect(build.hasExit()).toMatchObject({ exitCode: 1 });
    });

    const stderr = build.stderrArr.map((item) => item.contents).join('\n');

    expect(stderr).toMatchInlineSnapshot(`
      "Error importing sku render entrypoint
      Error: Render entrypoint error
          at <anonymous> ({cwd}/fixtures/vite-render-error/src/renderError.tsx:7:7)
          at ModuleJob.run (node:internal/modules/esm/module_job:343:25)
          at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
          at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:665:26)
          at async Promise.all (index 1)
          at async file://{cwd}/packages/sku/dist/vite/prerender-worker.mjs:17:28"
    `);
  });
});
