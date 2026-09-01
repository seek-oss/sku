import { describe, beforeAll, it, vi, expect } from 'vitest';
import { dirContentsToObject, getPort } from '@sku-private/test-utils';

import { getAppSnapshot } from '@sku-private/playwright';

import {
  bundlers,
  type BundlerValues,
  cleanup,
  skipCleanup,
  scopeToFixture,
  configure,
} from '@sku-private/testing-library';

const timeout = 50_000;

configure({
  asyncUtilTimeout: timeout,
});

vi.setConfig({
  hookTimeout: timeout + 1000,
  testTimeout: timeout + 1000,
});

function getLocalUrl(site: 'seekAnz' | 'jobStreet', port: number) {
  const host =
    site === 'jobStreet' ? 'jobstreet.com.localhost' : 'au.seek.com.localhost';

  return `http://${host}:${port}`;
}

const stripReactComments = (html: string) => html.replaceAll('<!-- -->', '');

const { sku, fixturePath } = scopeToFixture('braid-design-system');

describe('braid-design-system', () => {
  describe.for(bundlers)('bundler %s', (bundler) => {
    describe('start', async () => {
      const port = await getPort();

      const args: BundlerValues<string[]> = {
        vite: [
          '--config',
          'sku.config.vite.ts',
          '--strict-port',
          `--port=${port}`,
        ],
        webpack: ['--strict-port', `--port=${port}`],
      };

      beforeAll(async () => {
        const start = await sku('start', args[bundler]);
        await start.findByText('Starting development server');
      });

      it('should return development seekAnz site', async ({ task }) => {
        skipCleanup(task.id);

        const snapshot = await getAppSnapshot({
          url: getLocalUrl('seekAnz', port),
        });
        expect(snapshot).toMatchSnapshot();
      });

      it('should return development jobStreet site', async ({ task }) => {
        skipCleanup(task.id);
        const snapshot = await getAppSnapshot({
          url: getLocalUrl('jobStreet', port),
        });
        expect(snapshot).toMatchSnapshot();
      });
    });

    describe('build', async () => {
      const port = await getPort();
      const args: BundlerValues<string[]> = {
        vite: ['--config', 'sku.config.vite.ts'],
        webpack: [],
      };

      beforeAll(async () => {
        const build = await sku('build', args[bundler]);
        await expect(build).toMatchExitCode(0);

        const serve = await sku('serve', ['--strict-port', `--port=${port}`]);
        await serve.findByText('Server started');

        return cleanup;
      });

      it('should return built jobStreet site', async ({ task }) => {
        skipCleanup(task.id);
        const app = await getAppSnapshot({
          url: getLocalUrl('jobStreet', port),
        });
        expect(app).toMatchSnapshot();
      });

      it('should return built seekAnz site', async ({ task }) => {
        skipCleanup(task.id);
        const app = await getAppSnapshot({
          url: getLocalUrl('seekAnz', port),
        });
        expect(app).toMatchSnapshot();
      });

      it('should generate the expected files', async ({ task }) => {
        skipCleanup(task.id);
        const files = await dirContentsToObject(fixturePath('dist'));
        expect(files).toMatchSnapshot();
      });
    });
  });

  it('should handle braid-design-system in tests', async () => {
    const test = await sku('test');
    expect(await test.findByError('1 passed, 1 total')).toBeInTheConsole();
  });
});

describe('braid-design-system ssr', () => {
  describe('start', async () => {
    const port = await getPort();

    beforeAll(async () => {
      const start = await sku('start', [
        '--config',
        'sku.config.ssr.ts',
        '--strict-port',
        `--port=${port}`,
      ]);
      await start.findByText('Starting development server');
    });

    it('should return development seekAnz site', async ({ task }) => {
      skipCleanup(task.id);

      const response = await fetch(getLocalUrl('seekAnz', port));
      const html = await response.text();

      expect(response.ok).toBe(true);
      expect(stripReactComments(html)).toContain('Hello seekAnz');
      expect(html).toContain('This is a checkbox');
      expect(html).toContain('Vanilla content');
      expect(html).not.toContain('Braid components imported before reset');
    });

    it('should return development jobStreet site', async ({ task }) => {
      skipCleanup(task.id);

      const response = await fetch(getLocalUrl('jobStreet', port));
      const html = await response.text();

      expect(response.ok).toBe(true);
      expect(stripReactComments(html)).toContain('Hello jobStreet');
      expect(html).toContain('This is a checkbox');
      expect(html).toContain('Vanilla content');
      expect(html).not.toContain('Braid components imported before reset');
    });

    it('should hydrate client content', async ({ task }) => {
      skipCleanup(task.id);

      const snapshot = await getAppSnapshot({
        url: getLocalUrl('seekAnz', port),
      });

      expect(stripReactComments(snapshot.clientRenderContent)).toContain(
        'Vanilla content Client',
      );
    });
  });
});
