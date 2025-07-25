import { describe, it } from 'vitest';
import { getAppSnapshot } from '@sku-private/puppeteer';
import { scopeToFixture } from '@sku-private/testing-library';
import { getPort } from '@sku-private/test-utils';

const { sku } = scopeToFixture('polyfills');

describe('polyfills', () => {
  const args: Record<string, string[]> = {
    vite: ['--config', 'sku.config.vite.ts', '--experimental-bundler'],
  };

  describe.sequential.for(['webpack'])('bundler %s', async (bundler) => {
    const port = await getPort();
    const baseUrl = `http://localhost:${port}`;

    describe('build', () => {
      it('should create valid app', async ({ expect }) => {
        const build = await sku('build', args[bundler]);
        expect(await build.findByText('Sku build complete')).toBeInTheConsole();

        const serve = await sku('serve', ['--strict-port', `--port=${port}`]);
        expect(await serve.findByText('Server started')).toBeInTheConsole();

        const app = await getAppSnapshot({ url: baseUrl, expect });
        expect(app).toMatchSnapshot();
      });
    });

    describe('start', () => {
      it('should start a development server', async ({ expect }) => {
        const start = await sku('start', ['--strict-port', `--port=${port}`]);
        expect(
          await start.findByText('Starting development server'),
        ).toBeInTheConsole();

        const app = await getAppSnapshot({ url: baseUrl, expect });
        expect(app).toMatchSnapshot();
      });
    });
  });
});
