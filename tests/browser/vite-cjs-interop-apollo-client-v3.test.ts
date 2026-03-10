import { describe, beforeAll, it, expect } from 'vitest';
import { dirContentsToObject, getPort } from '@sku-private/test-utils';
import { getAppSnapshot } from '@sku-private/playwright';

import { scopeToFixture, skipCleanup } from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture(
  'vite-cjs-interop-apollo-client-v3',
);

describe('vite-cjs-interop-apollo-client-v3', () => {
  describe('start', async () => {
    const port = await getPort();
    const url = `http://localhost:${port}`;
    const portArgs = ['--strict-port', `--port=${port}`];

    it(`should render home page correctly`, async ({ task }) => {
      const start = await sku('start', portArgs);
      await start.findByText('Starting development server');

      skipCleanup(task.id);

      const snapshot = await getAppSnapshot({
        url,
      });
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('build and serve', async () => {
    const port = await getPort();
    const url = `http://localhost:${port}`;
    const portArgs = ['--strict-port', `--port=${port}`];

    beforeAll(async () => {
      const build = await sku('build');
      await build.findByText('Sku build complete');

      const serve = await sku('serve', portArgs);
      await serve.findByText('Server started');
    });

    it(`should render home page correctly`, async ({ task }) => {
      skipCleanup(task.id);
      const snapshot = await getAppSnapshot({
        url,
      });
      expect(snapshot).toMatchSnapshot();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(fixturePath('dist'));
      expect(files).toMatchSnapshot();
    });
  });
});
