import { describe, it, expect } from 'vitest';
import { getAppSnapshot } from '@sku-private/playwright';
import {
  bundlers,
  type BundlerValues,
  scopeToFixture,
} from '@sku-private/testing-library';
import { getPort } from '@sku-private/test-utils';

const { exec } = scopeToFixture('react-18');
// Use the fixtures sku binary so that dependencies are resolved according to the fixtures package.json (allowing injected dependencies to work).
const skuBin = './node_modules/.bin/sku';

describe('react-18', () => {
  const args: BundlerValues<string[]> = {
    vite: ['--config', 'sku.config.vite.ts'],
    webpack: [],
  };

  describe.for(bundlers)('bundler %s', async (bundler) => {
    const port = await getPort();
    const baseUrl = `http://localhost:${port}`;

    describe('build', () => {
      it('should create valid app', async () => {
        const build = await exec(skuBin, ['build', ...args[bundler]]);
        expect(await build.findByText('Sku build complete')).toBeInTheConsole();

        const serve = await exec(skuBin, [
          'serve',
          '--strict-port',
          `--port=${port}`,
        ]);
        expect(await serve.findByText('Server started')).toBeInTheConsole();

        const app = await getAppSnapshot({ url: baseUrl });
        expect(app).toMatchSnapshot();
      });
    });

    describe('start', () => {
      it('should start a development server', async () => {
        const start = await exec(skuBin, [
          'start',
          '--strict-port',
          `--port=${port}`,
        ]);
        expect(
          await start.findByText('Starting development server'),
        ).toBeInTheConsole();

        const app = await getAppSnapshot({ url: baseUrl });
        expect(app).toMatchSnapshot();
      });
    });
  });
});
