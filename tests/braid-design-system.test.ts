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

function getLocalUrl(site: string, port: number) {
  const host = site === 'jobStreet' ? 'dev.jobstreet.com' : 'dev.seek.com.au';

  return `http://${host}:${port}`;
}

const { render, joinPath } = scopeToFixture('braid-design-system');

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
        const start = await render('start', args[bundler]);
        expect(
          await start.findByText('Starting development server'),
        ).toBeInTheConsole();
      });

      afterAll(cleanup);

      it('should return development seekAnz site', async ({ task }) => {
        skipCleanup(task.id);

        const snapshot = await getAppSnapshot({
          url: getLocalUrl('seekAnz', port),
          expect,
        });
        expect(snapshot).toMatchSnapshot();
      });

      it('should return development jobStreet site', async ({ task }) => {
        skipCleanup(task.id);
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
        skipCleanup(task.id);
        const app = await getAppSnapshot({
          url: getLocalUrl('jobStreet', port),
          expect,
        });
        expect(app).toMatchSnapshot();
      });

      it('should return built seekAnz site', async ({ task }) => {
        skipCleanup(task.id);
        const app = await getAppSnapshot({
          url: getLocalUrl('seekAnz', port),
          expect,
        });
        expect(app).toMatchSnapshot();
      });

      it('should generate the expected files', async ({ task }) => {
        skipCleanup(task.id);
        const files = await dirContentsToObject(joinPath('dist'));
        expect(files).toMatchSnapshot();
      });
    });
  });

  it('should handle braid-design-system in tests', async () => {
    const test = await render('test');
    expect(await test.findByError('1 passed, 1 total')).toBeInTheConsole();
  });
});
