import { describe, beforeAll, it, onTestFinished, expect } from 'vitest';
import path from 'node:path';
import { dirContentsToObject, getPort } from '@sku-private/test-utils';

import { getAppSnapshot } from '@sku-private/puppeteer';

import { createRequire } from 'node:module';
import {
  bundlers,
  type BundlerValues,
  cleanup,
  deferCleanup,
  scopeToFixture,
} from '@sku-private/testing-library';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/braid-design-system/sku.config.js'),
);
const distDir = path.resolve(appDir, 'dist');

function getLocalUrl(site: string, port: number) {
  const host = site === 'jobStreet' ? 'dev.jobstreet.com' : 'dev.seek.com.au';

  return `http://${host}:${port}`;
}

const { render } = scopeToFixture('braid-design-system');

describe('braid-design-system', () => {
  describe.sequential.for(bundlers)('bundler %s', (bundler) => {
    describe('start', async () => {
      const port = await getPort();

      const args: BundlerValues<string[]> = {
        vite: [
          '--config',
          'sku.config.vite.js',
          '--experimental-bundler',
          '--strict-port',
          `--port=${port}`,
        ],
        webpack: ['--strict-port', `--port=${port}`],
      };

      beforeAll(async () => {
        const expectedText: BundlerValues<string> = {
          vite: 'Local: http://localhost',
          webpack: 'Starting the development server',
        };

        const start = await render('start', args[bundler]);
        expect(
          await start.findByText(expectedText[bundler]),
        ).toBeInTheConsole();

        return cleanup;
      });

      it('should return development seekAnz site', async ({ task }) => {
        deferCleanup(task.id, onTestFinished);

        const snapshot = await getAppSnapshot({
          url: getLocalUrl('seekAnz', port),
          expect,
        });
        expect(snapshot).toMatchSnapshot();
      });

      it('should return development jobStreet site', async ({ task }) => {
        deferCleanup(task.id, onTestFinished);
        const snapshot = await getAppSnapshot({
          url: getLocalUrl('jobStreet', port),
          expect,
        });
        expect(snapshot).toMatchSnapshot();
      });
    });

    describe('build', async () => {
      const port = await getPort();
      const args: BundlerValues<string[]> = {
        vite: ['--config', 'sku.config.vite.js', '--experimental-bundler'],
        webpack: [],
      };

      beforeAll(async () => {
        const build = await render('build', args[bundler]);
        expect(
          await build.findByText('Sku build complete', undefined, {
            timeout: 10000,
          }),
        ).toBeInTheConsole();

        const serve = await render('serve', [
          '--strict-port',
          `--port=${port}`,
        ]);
        expect(await serve.findByText('Server started')).toBeInTheConsole();

        return cleanup;
      });

      it('should return built jobStreet site', async ({ task }) => {
        deferCleanup(task.id, onTestFinished);
        const app = await getAppSnapshot({
          url: getLocalUrl('jobStreet', port),
          expect,
        });
        expect(app).toMatchSnapshot();
      });

      it('should return built seekAnz site', async ({ task }) => {
        deferCleanup(task.id, onTestFinished);
        const app = await getAppSnapshot({
          url: getLocalUrl('seekAnz', port),
          expect,
        });
        expect(app).toMatchSnapshot();
      });

      it('should generate the expected files', async ({ task }) => {
        deferCleanup(task.id, onTestFinished);
        const files = await dirContentsToObject(distDir);
        expect(files).toMatchSnapshot();
      });
    });
  });

  it('should handle braid-design-system in tests', async () => {
    const test = await render('test');
    expect(await test.findByError('1 passed, 1 total')).toBeInTheConsole();
  });
});
