import {
  describe,
  beforeAll,
  it,
  expect as globalExpect,
  afterAll,
} from 'vitest';
import { dirContentsToObject, getPort } from '@sku-private/test-utils';

import { getAppSnapshot } from '@sku-private/puppeteer';

import {
  bundlers,
  type BundlerValues,
  cleanup,
  skipCleanup,
  scopeToFixture,
} from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('custom-src-paths');

describe('custom-src-paths', () => {
  describe.sequential.for(bundlers)('bundler %s', (bundler) => {
    describe('start', async () => {
      it('should start a development server', async ({ expect }) => {
        const port = await getPort();
        const url = `http://localhost:${port}`;

        const args: BundlerValues<string[]> = {
          vite: [
            '--config',
            'sku.config.vite.ts',
            '--experimental-bundler',
            '--strict-port',
            `--port=${port}`,
          ],
          webpack: ['--strict-port', `--port=${port}`],
        };

        const start = await sku('start', args[bundler]);
        globalExpect(
          await start.findByText('Starting development server'),
        ).toBeInTheConsole();

        const snapshot = await getAppSnapshot({ url, expect });
        expect(snapshot).toMatchSnapshot();
      });
    });

    describe('build', async () => {
      const port = await getPort();
      const url = `http://localhost:${port}`;
      const portArgs = ['--strict-port', `--port=${port}`];

      const args: BundlerValues<string[]> = {
        vite: ['--config', 'sku.config.vite.ts', '--experimental-bundler'],
        webpack: [],
      };

      beforeAll(async () => {
        const build = await sku('build', args[bundler]);
        globalExpect(
          await build.findByText('Build complete'),
        ).toBeInTheConsole();

        const serve = await sku('serve', portArgs);
        globalExpect(
          await serve.findByText('Server started'),
        ).toBeInTheConsole();
      });

      afterAll(cleanup);

      it('should generate the expected files', async ({ expect, task }) => {
        skipCleanup(task.id);
        const files = await dirContentsToObject(fixturePath('dist'));
        expect(files).toMatchSnapshot();
      });

      it('should create valid app', async ({ task, expect }) => {
        skipCleanup(task.id);

        const app = await getAppSnapshot({ url, expect });
        expect(app).toMatchSnapshot();
      });
    });
  });

  describe('format', () => {
    it('should format successfully', async ({ expect }) => {
      const format = await sku('format');
      expect(await format.findByText('Formatting complete')).toBeInTheConsole();
    });
  });

  describe('lint', () => {
    it('should lint successfully', async ({ expect }) => {
      const lint = await sku('lint');
      expect(await lint.findByText('Linting complete')).toBeInTheConsole();
    });
  });
});
