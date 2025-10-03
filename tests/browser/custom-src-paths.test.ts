import { describe, beforeAll, it, expect, afterAll } from 'vitest';
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
  describe.for(bundlers)('bundler %s', (bundler) => {
    describe('start', async () => {
      it('should start a development server', async () => {
        const port = await getPort();
        const url = `http://localhost:${port}`;

        const args: BundlerValues<string[]> = {
          vite: [
            '--config',
            'sku.config.vite.ts',
            '--strict-port',
            `--port=${port}`,
          ],
          webpack: ['--strict-port', `--port=${port}`],
        };

        const start = await sku('start', args[bundler]);
        expect(
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
        vite: ['--config', 'sku.config.vite.ts'],
        webpack: [],
      };

      beforeAll(async () => {
        const build = await sku('build', args[bundler]);
        expect(await build.findByText('Build complete')).toBeInTheConsole();

        const serve = await sku('serve', portArgs);
        expect(await serve.findByText('Server started')).toBeInTheConsole();
      });

      afterAll(cleanup);

      it('should generate the expected files', async ({ task }) => {
        skipCleanup(task.id);
        const files = await dirContentsToObject(fixturePath('dist'));
        expect(files).toMatchSnapshot();
      });

      it('should create valid app', async ({ task }) => {
        skipCleanup(task.id);

        const app = await getAppSnapshot({ url, expect });
        expect(app).toMatchSnapshot();
      });
    });
  });

  describe('format', () => {
    it('should format successfully', async () => {
      const format = await sku('format');
      expect(await format.findByText('Formatting complete')).toBeInTheConsole();
    });
  });

  describe('lint', () => {
    it('should lint successfully', async () => {
      const lint = await sku('lint');
      expect(await lint.findByText('Linting complete')).toBeInTheConsole();
    });
  });
});
