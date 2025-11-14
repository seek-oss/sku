import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { dirContentsToObject, getPort } from '@sku-private/test-utils';
import { getAppSnapshot } from '@sku-private/playwright';

import {
  bundlers,
  type BundlerValues,
  cleanup,
  scopeToFixture,
  skipCleanup,
} from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('multiple-routes');

describe('multiple-routes', () => {
  describe.for(bundlers)('bundler: %s', (bundler) => {
    describe('start', async () => {
      const port = await getPort();
      const url = `http://localhost:${port}`;
      const portArgs = ['--strict-port', `--port=${port}`];

      const args: BundlerValues<string[]> = {
        vite: [
          '--config',
          'sku.config.vite.js',
          '--convert-loadable',
          ...portArgs,
        ],
        webpack: portArgs,
      };

      beforeAll(async () => {
        const start = await sku('start', args[bundler]);
        expect(
          await start.findByText('Starting development server'),
        ).toBeInTheConsole();
      });

      afterAll(cleanup);

      it(`should render home page correctly`, async ({ task }) => {
        skipCleanup(task.id);
        const snapshot = await getAppSnapshot({
          url,
        });
        expect(snapshot).toMatchSnapshot();
      });

      it(`should render details page correctly`, async ({ task }) => {
        skipCleanup(task.id);
        const snapshot = await getAppSnapshot({
          url: `${url}/details/123`,
        });
        expect(snapshot).toMatchSnapshot();
      });
    });

    describe('build and serve', async () => {
      const port = await getPort();

      const url = `http://localhost:${port}`;
      const portArgs = ['--strict-port', `--port=${port}`];

      const args: BundlerValues<string[]> = {
        vite: ['--convert-loadable', '--config', 'sku.config.vite.js'],
        webpack: [],
      };

      beforeAll(async () => {
        const build = await sku('build', args[bundler]);
        expect(await build.findByText('Sku build complete')).toBeInTheConsole();

        const serve = await sku('serve', portArgs);
        expect(await serve.findByText('Server started')).toBeInTheConsole();
      });

      afterAll(cleanup);

      it(`should render home page correctly`, async ({ task }) => {
        skipCleanup(task.id);
        const snapshot = await getAppSnapshot({
          url,
        });
        expect(snapshot).toMatchSnapshot();
      });

      it(`should render details page correctly`, async ({ task }) => {
        skipCleanup(task.id);
        const snapshot = await getAppSnapshot({
          url: `${url}/details/123`,
        });
        expect(snapshot).toMatchSnapshot();
      });

      it('should generate the expected files', async () => {
        const files = await dirContentsToObject(fixturePath('dist'));
        expect(files).toMatchSnapshot();
      });
    });
  });

  describe('test', () => {
    it('should handle dynamic imports in tests', async () => {
      const test = await sku('test');

      expect(
        await test.findByError('Test Suites: 1 passed, 1 total'),
      ).toBeInTheConsole();
    });
  });
});
