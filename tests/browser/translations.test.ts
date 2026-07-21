import { describe, beforeAll, it, expect } from 'vitest';
import { getAppSnapshot } from '@sku-private/playwright';
import { getPort } from '@sku-private/test-utils';
import {
  bundlers,
  type BundlerValues,
  scopeToFixture,
  skipCleanup,
} from '@sku-private/testing-library';
import { rm } from 'node:fs/promises';

const { sku, fixturePath } = scopeToFixture('translations');

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
      await build.findByText('Sku build complete');

      const serve = await sku('serve', ['--strict-port', `--port=${port}`]);
      await serve.findByText('Server started');
    });

    it('should render en', async ({ task }) => {
      skipCleanup(task.id);
      const app = await getAppSnapshot({ url: `${baseUrl}/en` });
      expect(app).toMatchSnapshot();
    });

    it('should render fr', async ({ task }) => {
      skipCleanup(task.id);
      const app = await getAppSnapshot({ url: `${baseUrl}/fr` });
      expect(app).toMatchSnapshot();
    });

    it('should render en-PSEUDO post-hydration', async ({ task }) => {
      skipCleanup(task.id);
      const app = await getAppSnapshot({
        url: `${baseUrl}/en?pseudo=true`,
      });
      expect(app).toMatchSnapshot();
    });

    it('should support query parameters', async ({ task }) => {
      skipCleanup(task.id);
      const app = await getAppSnapshot({ url: `${baseUrl}/en?a=1` });
      expect(app).toMatchSnapshot();
    });
  });
});

describe('ssr translations', () => {
  const backendUrl = `http://localhost:8314`;

  beforeAll(async () => {
    const distDir = fixturePath('dist');
    await rm(distDir, { recursive: true, force: true });

    const startSsr = await sku('start-ssr', ['--config=sku-ssr.config.ts']);
    await startSsr.findByText('Server started');
  });

  it('should render en', async ({ task }) => {
    skipCleanup(task.id);
    const app = await getAppSnapshot({ url: `${backendUrl}/en` });
    expect(app).toMatchSnapshot();
  });

  it('should render fr', async ({ task }) => {
    skipCleanup(task.id);
    const app = await getAppSnapshot({ url: `${backendUrl}/fr` });
    expect(app).toMatchSnapshot();
  });

  it('should render en-PSEUDO', async ({ task }) => {
    skipCleanup(task.id);
    const app = await getAppSnapshot({
      url: `${backendUrl}/en?pseudo=true`,
    });
    expect(app).toMatchSnapshot();
  });
});
