import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { getAppSnapshot } from '@sku-private/puppeteer';
import { getPort } from '@sku-private/test-utils';
import {
  bundlers,
  type BundlerValues,
  scopeToFixture,
  cleanup,
  skipCleanup,
} from '@sku-private/testing-library';

const { sku } = scopeToFixture('translations');

describe('translations', () => {
  describe.for(bundlers)('bundler %s', async (bundler) => {
    const port = await getPort();
    const baseUrl = `http://localhost:${port}`;
    const args: BundlerValues<string[]> = {
      vite: ['--config', 'sku.config.vite.ts'],
      webpack: [],
    };

    beforeAll(async () => {
      const build = await sku('build', args[bundler]);
      expect(await build.findByText('Sku build complete')).toBeInTheConsole();

      const serve = await sku('serve', ['--strict-port', `--port=${port}`]);
      expect(await serve.findByText('Server started')).toBeInTheConsole();
    });

    afterAll(cleanup);

    it('should render en', async ({ task }) => {
      skipCleanup(task.id);
      const app = await getAppSnapshot({ url: `${baseUrl}/en`, expect });
      expect(app).toMatchSnapshot();
    });

    it('should render fr', async ({ task }) => {
      skipCleanup(task.id);
      const app = await getAppSnapshot({ expect, url: `${baseUrl}/fr` });
      expect(app).toMatchSnapshot();
    });

    it('should render en-PSEUDO post-hydration', async ({ task }) => {
      skipCleanup(task.id);
      const app = await getAppSnapshot({
        expect,
        url: `${baseUrl}/en?pseudo=true`,
      });
      expect(app).toMatchSnapshot();
    });

    it('should support query parameters', async ({ task }) => {
      skipCleanup(task.id);
      const app = await getAppSnapshot({ expect, url: `${baseUrl}/en?a=1` });
      expect(app).toMatchSnapshot();
    });
  });
});
