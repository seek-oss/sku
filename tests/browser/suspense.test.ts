import { describe, beforeAll, it, expect } from 'vitest';
import { getAppSnapshot } from '@sku-private/puppeteer';
import { dirContentsToObject, getPort } from '@sku-private/test-utils';
import {
  bundlers,
  type BundlerValues,
  scopeToFixture,
} from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('suspense');

const targetDirectory = fixturePath('dist');

describe('suspense', () => {
  describe.for(bundlers)('bundler %s', async (bundler) => {
    const port = await getPort();
    const url = `http://localhost:${port}`;
    const args: BundlerValues<string[]> = {
      vite: ['--config', 'sku.config.vite.js'],
      webpack: [],
    };

    describe('build and serve', () => {
      beforeAll(async () => {
        const build = await sku('build', args[bundler]);
        expect(await build.findByText('Sku build complete')).toBeInTheConsole();
      });

      it('should return home page', async () => {
        const serve = await sku('serve', ['--strict-port', `--port=${port}`]);
        expect(await serve.findByText('Server started')).toBeInTheConsole();

        const app = await getAppSnapshot({ url, expect });
        expect(app).toMatchSnapshot();
      });

      it('should generate the expected files', async () => {
        const files = await dirContentsToObject(targetDirectory);
        expect(files).toMatchSnapshot();
      });
    });
  });
});
