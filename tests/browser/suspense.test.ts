import { describe, beforeAll, it, expect as globalExpect } from 'vitest';
import { getAppSnapshot } from '@sku-private/puppeteer';
import { dirContentsToObject, getPort } from '@sku-private/test-utils';
import {
  bundlers,
  type BundlerValues,
  scopeToFixture,
} from '@sku-private/testing-library';

const { render, joinPath } = scopeToFixture('suspense');

const targetDirectory = joinPath('dist');

describe('suspense', () => {
  describe.sequential.for(bundlers)('bundler %s', async (bundler) => {
    const port = await getPort();
    const url = `http://localhost:${port}`;
    const args: BundlerValues<string[]> = {
      vite: ['--experimental-bundler', '--config', 'sku.config.vite.js'],
      webpack: [],
    };

    describe('build and serve', () => {
      beforeAll(async () => {
        const build = await render('build', args[bundler]);
        globalExpect(
          await build.findByText('Sku build complete'),
        ).toBeInTheConsole();
      });

      it('should return home page', async ({ expect }) => {
        const serve = await render('serve', [
          '--strict-port',
          `--port=${port}`,
        ]);
        globalExpect(
          await serve.findByText('Server started'),
        ).toBeInTheConsole();

        const app = await getAppSnapshot({ url, expect });
        expect(app).toMatchSnapshot();
      });

      it('should generate the expected files', async ({ expect }) => {
        const files = await dirContentsToObject(targetDirectory);
        expect(files).toMatchSnapshot();
      });
    });
  });
});
