import { describe, it } from 'vitest';
import { dirContentsToObject, getPort } from '@sku-private/test-utils';
import { getAppSnapshot } from '@sku-private/puppeteer';
import {
  bundlers,
  type BundlerValues,
  scopeToFixture,
} from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('public-path');

describe('public path', () => {
  describe.each(bundlers)('bundler: %s', (bundler) => {
    describe('build and serve', async () => {
      const port = await getPort();
      const portArgs = ['--strict-port', `--port=${port}`];
      const args: BundlerValues<string[]> = {
        vite: ['--config', 'sku.config.vite.js', '--experimental-bundler'],
        webpack: [],
      };

      it('should build, serve, and create valid app with no unresolved resources', async ({
        expect,
      }) => {
        const build = await sku('build', args[bundler]);
        expect(await build.findByText('Sku build complete')).toBeInTheConsole();

        const serve = await sku('serve', portArgs);
        expect(await serve.findByText('Server started')).toBeInTheConsole();

        const url = `http://localhost:${port}`;
        const app = await getAppSnapshot({ url, expect });
        expect(app).toMatchSnapshot();

        const files = await dirContentsToObject(fixturePath('dist'));
        expect(files).toMatchSnapshot();
      });
    });
  });
});
