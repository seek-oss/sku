import {
  describe,
  beforeAll,
  afterAll,
  it,
  expect as globalExpect,
} from 'vitest';
import { getAppSnapshot } from '@sku-private/puppeteer';
import { getPort } from '@sku-private/test-utils';
import {
  bundlers,
  type BundlerValues,
  scopeToFixture,
  cleanup,
  skipCleanup,
} from '@sku-private/testing-library';

const { render } = scopeToFixture('translations');

describe('translations', () => {
  describe.sequential.for(bundlers)('bundler %s', async (bundler) => {
    const port = await getPort();
    const baseUrl = `http://localhost:${port}`;
    const args: BundlerValues<string[]> = {
      vite: ['--config', 'sku.config.vite.ts', '--experimental-bundler'],
      webpack: [],
    };

    beforeAll(async () => {
      const build = await render('build', args[bundler]);
      globalExpect(
        await build.findByText('Sku build complete'),
      ).toBeInTheConsole();

      const serve = await render('serve', ['--strict-port', `--port=${port}`]);
      globalExpect(await serve.findByText('Server started')).toBeInTheConsole();
    });

    afterAll(cleanup);

    it('should render en', async ({ expect, task }) => {
      skipCleanup(task.id);
      const app = await getAppSnapshot({ url: `${baseUrl}/en`, expect });
      expect(app).toMatchSnapshot();
    });

    it('should render fr', async ({ expect, task }) => {
      skipCleanup(task.id);
      const app = await getAppSnapshot({ expect, url: `${baseUrl}/fr` });
      expect(app).toMatchSnapshot();
    });

    it('should render en-PSEUDO post-hydration', async ({ expect, task }) => {
      skipCleanup(task.id);
      const app = await getAppSnapshot({
        expect,
        url: `${baseUrl}/en?pseudo=true`,
      });
      expect(app).toMatchSnapshot();
    });

    it('should support query parameters', async ({ expect, task }) => {
      skipCleanup(task.id);
      const app = await getAppSnapshot({ expect, url: `${baseUrl}/en?a=1` });
      expect(app).toMatchSnapshot();
    });
  });
});
