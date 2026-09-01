import { describe, beforeAll, it, expect } from 'vitest';
import { createPage, getTextContent } from '@sku-private/playwright';
import { getPort } from '@sku-private/test-utils';

import { scopeToFixture, skipCleanup } from '@sku-private/testing-library';

const { sku } = scopeToFixture('vite-compile-package-styles');

const packageComponent = '[data-automation-package-component]';

describe('vite-compile-package-styles', () => {
  describe('start', async () => {
    const port = await getPort();
    const url = `http://localhost:${port}`;

    beforeAll(async () => {
      const start = await sku('start', ['--strict-port', `--port=${port}`]);
      await start.findByText('Starting development server');
    });

    it('should scope styles shipped as source by a compile package', async ({
      task,
    }) => {
      skipCleanup(task.id);

      const { text, fontSize } = await getTextContent(url, packageComponent);

      // Vanilla Extract throws when a style is evaluated outside a file scope,
      // which is what happens if the package is prebundled without its `.css.ts`
      // files being handed back to the Vanilla Extract plugin.
      expect(fontSize).toEqual('32px');
      // The package's CommonJS dependency stays prebundled, so interop still applies.
      expect(text).toEqual('cjs-only-dependency');
    });

    it('should evaluate the package without runtime errors', async ({
      task,
    }) => {
      skipCleanup(task.id);

      const page = await createPage();
      // An unhandled module exception surfaces as a page error rather than a
      // console message, so `getAppSnapshot` would not catch it.
      // TODO make getAppSnapshot catch page errors. Vite translation tests currently fail with it, so leaving as a separate PR
      const pageErrors: string[] = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));

      await page.goto(url);
      await page.close();

      expect(pageErrors).toEqual([]);
    });
  });

  describe('build and serve', async () => {
    const port = await getPort();
    const url = `http://localhost:${port}`;

    beforeAll(async () => {
      const build = await sku('build');
      await expect(build).toMatchExitCode(0);

      const serve = await sku('serve', ['--strict-port', `--port=${port}`]);
      await serve.findByText('Server started');
    });

    it('should scope styles shipped as source by a compile package', async ({
      task,
    }) => {
      skipCleanup(task.id);

      const { text, fontSize } = await getTextContent(url, packageComponent);

      expect(fontSize).toEqual('32px');
      expect(text).toEqual('cjs-only-dependency');
    });
  });
});
