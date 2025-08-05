import {
  describe,
  beforeAll,
  it,
  expect as globalExpect,
  afterAll,
  vi,
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

const timeout = 50_000;

vi.setConfig({
  hookTimeout: timeout + 1000,
  testTimeout: timeout + 1000,
});

function getLocalUrl(site: string, port: number) {
  const host = site === 'jobStreet' ? 'dev.jobstreet.com' : 'dev.seek.com.au';

  return `http://${host}:${port}`;
}

const { sku, fixturePath } = scopeToFixture('braid-design-system');

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
        const start = await sku('start', args[bundler]);
        globalExpect(
          await start.findByText(
            'Starting development server',
            {},
            { timeout },
          ),
        ).toBeInTheConsole();
      });

      afterAll(cleanup);

      it('should return development seekAnz site', async ({ expect, task }) => {
        skipCleanup(task.id);

        const snapshot = await getAppSnapshot({
          url: getLocalUrl('seekAnz', port),
          expect,
          timeout,
        });
        expect(snapshot).toMatchSnapshot();
      });

      it('should return development jobStreet site', async ({
        expect,
        task,
      }) => {
        skipCleanup(task.id);
        const snapshot = await getAppSnapshot({
          url: getLocalUrl('jobStreet', port),
          expect,
          timeout,
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
        const build = await sku('build', args[bundler]);
        globalExpect(
          await build.findByText('Sku build complete', {}, { timeout }),
        ).toBeInTheConsole();

        const serve = await sku('serve', ['--strict-port', `--port=${port}`]);
        globalExpect(
          await serve.findByText('Server started'),
        ).toBeInTheConsole();

        return cleanup;
      });

      it('should return built jobStreet site', async ({ expect, task }) => {
        skipCleanup(task.id);
        const app = await getAppSnapshot({
          url: getLocalUrl('jobStreet', port),
          expect,
          timeout,
        });
        expect(app).toMatchSnapshot();
      });

      it('should return built seekAnz site', async ({ expect, task }) => {
        skipCleanup(task.id);
        const app = await getAppSnapshot({
          url: getLocalUrl('seekAnz', port),
          expect,
          timeout,
        });
        expect(app).toMatchSnapshot();
      });

      it('should generate the expected files', async ({ expect, task }) => {
        skipCleanup(task.id);
        const files = await dirContentsToObject(fixturePath('dist'));
        expect(files).toMatchSnapshot();
      });
    });
  });

  it('should handle braid-design-system in tests', async ({ expect }) => {
    const test = await sku('test');
    expect(await test.findByError('1 passed, 1 total')).toBeInTheConsole();
  });
});
