import { describe, it, expect } from 'vitest';
import { dirContentsToObject, getPort } from '@sku-private/test-utils';
import {
  bundlers,
  type BundlerValues,
  scopeToFixture,
} from '@sku-private/testing-library';
import { getAppSnapshot } from '@sku-private/playwright';

const { sku, fixturePath } = scopeToFixture('public-assets');

describe('public assets', () => {
  describe.each(bundlers)('bundler: %s', (bundler) => {
    describe('start', async () => {
      const port = await getPort();
      const url = `http://localhost:${port}`;
      const portArgs = ['--strict-port', `--port=${port}`];
      const args: BundlerValues<string[]> = {
        vite: ['--config', 'sku.config.vite.ts', ...portArgs],
        webpack: portArgs,
      };

      it('should serve the app and public assets', async () => {
        const start = await sku('start', args[bundler]);
        expect(
          await start.findByText('Starting development server'),
        ).toBeInTheConsole();

        const snapshot = await getAppSnapshot({ url });
        expect(snapshot).toMatchSnapshot();

        const robotsResponse = await fetch(`${url}/robots.txt`);
        expect(await robotsResponse.text()).toBe('User-agent: *\nDisallow:\n');

        const iconResponse = await fetch(`${url}/nested/icon.png`);
        expect(iconResponse.status).toBe(200);
      });
    });

    describe('build and serve', async () => {
      const port = await getPort();
      const portArgs = ['--strict-port', `--port=${port}`];
      const args: BundlerValues<string[]> = {
        vite: ['--config', 'sku.config.vite.ts'],
        webpack: [],
      };

      it('should copy public assets to dist and serve them in the app', async () => {
        const build = await sku('build', args[bundler]);

        expect(await build.findByText('Sku build complete')).toBeInTheConsole();
        expect(
          await build.findByText(
            'Copying assets/favicon.ico to dist/favicon.ico',
          ),
        ).toBeInTheConsole();
        expect(
          await build.findByText(
            'Copying assets/nested/icon.png to dist/nested/icon.png',
          ),
        ).toBeInTheConsole();
        expect(
          await build.findByText(
            'Copying assets/robots.txt to dist/robots.txt',
          ),
        ).toBeInTheConsole();

        const serve = await sku('serve', portArgs);
        expect(await serve.findByText('Server started')).toBeInTheConsole();

        const url = `http://localhost:${port}`;
        const app = await getAppSnapshot({ url });
        expect(app).toMatchSnapshot();

        const files = await dirContentsToObject(fixturePath('dist'));
        expect(files).toMatchSnapshot();
      });
    });
  });
});
