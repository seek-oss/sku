import {
  describe,
  beforeAll,
  afterAll,
  it,
  expect as globalExpect,
} from 'vitest';
import { dirContentsToObject, getPort } from '@sku-private/test-utils';
import { getAppSnapshot } from '@sku-private/puppeteer';

import {
  bundlers,
  type BundlerValues,
  cleanup,
  scopeToFixture,
  skipCleanup,
} from '@sku-private/testing-library';

const { render, joinPath } = scopeToFixture('multiple-routes');

describe('multiple-routes', () => {
  describe.sequential.for(bundlers)('bundler: %s', (bundler) => {
    describe('start', async () => {
      const port = await getPort();
      const url = `http://localhost:${port}`;
      const portArgs = ['--strict-port', `--port=${port}`];

      const args: BundlerValues<string[]> = {
        vite: [
          '--config',
          'sku.config.vite.js',
          '--experimental-bundler',
          '--convert-loadable',
          ...portArgs,
        ],
        webpack: portArgs,
      };

      beforeAll(async () => {
        const start = await render('start', args[bundler]);
        globalExpect(
          await start.findByText('Starting development server'),
        ).toBeInTheConsole();
      });

      afterAll(cleanup);

      it(`should render home page correctly`, async ({ expect, task }) => {
        skipCleanup(task.id);
        const snapshot = await getAppSnapshot({
          url,
          expect,
        });
        expect(snapshot).toMatchSnapshot();
      });

      it(`should render details page correctly`, async ({ expect, task }) => {
        skipCleanup(task.id);
        const snapshot = await getAppSnapshot({
          url: `${url}/details/123`,
          expect,
        });
        expect(snapshot).toMatchSnapshot();
      });
    });

    describe('build and serve', async () => {
      const port = await getPort();

      const url = `http://localhost:${port}`;
      const portArgs = ['--strict-port', `--port=${port}`];

      const args: BundlerValues<string[]> = {
        vite: [
          '--convert-loadable',
          '--experimental-bundler',
          '--config',
          'sku.config.vite.js',
        ],
        webpack: [],
      };

      beforeAll(async () => {
        const build = await render('build', args[bundler]);
        globalExpect(
          await build.findByText('Sku build complete'),
        ).toBeInTheConsole();

        const serve = await render('serve', portArgs);
        globalExpect(
          await serve.findByText('Server started'),
        ).toBeInTheConsole();
      });

      afterAll(cleanup);

      it(`should render home page correctly`, async ({ expect, task }) => {
        skipCleanup(task.id);
        const snapshot = await getAppSnapshot({
          url,
          expect,
          waitUntil: 'load',
        });
        expect(snapshot).toMatchSnapshot();
      });

      it(`should render details page correctly`, async ({ expect, task }) => {
        skipCleanup(task.id);
        const snapshot = await getAppSnapshot({
          url: `${url}/details/123`,
          expect,
          waitUntil: 'load',
        });
        expect(snapshot).toMatchSnapshot();
      });

      it('should generate the expected files', async ({ expect }) => {
        const files = await dirContentsToObject(joinPath('dist'));
        expect(files).toMatchSnapshot();
      });
    });
  });

  describe('test', () => {
    it('should handle dynamic imports in tests', async ({ expect }) => {
      const test = await render('test');

      expect(
        await test.findByError('Test Suites: 1 passed, 1 total'),
      ).toBeInTheConsole();
    });
  });
});
