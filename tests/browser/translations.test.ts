import { describe, beforeAll, it, expect } from 'vitest';
import { getAppSnapshot } from '@sku-private/playwright';
import { getPort } from '@sku-private/test-utils';
import {
  bundlers,
  type BundlerValues,
  scopeToFixture,
  skipCleanup,
  waitFor,
} from '@sku-private/testing-library';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';

const { sku, node, fixturePath } = scopeToFixture('translations');

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
  const backendUrl = `http://localhost:8310`;

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

// Runs after webpack SSR in this file so both long-lived servers are not started concurrently.
describe('vite ssr translations', () => {
  const viteSsrUrl = `http://localhost:8315`;

  beforeAll(async () => {
    const distDir = fixturePath('dist');
    await rm(distDir, { recursive: true, force: true });

    const start = await sku('start', ['--config=sku.config.vite-ssr.ts']);
    await start.findByText('Starting development server');
  });

  it('should render en', async ({ task }) => {
    skipCleanup(task.id);
    const app = await getAppSnapshot({ url: `${viteSsrUrl}/en` });
    expect(app).toMatchSnapshot();
  });

  it('should render fr', async ({ task }) => {
    skipCleanup(task.id);
    const app = await getAppSnapshot({ url: `${viteSsrUrl}/fr` });
    expect(app).toMatchSnapshot();
  });

  it('should render en-PSEUDO', async ({ task }) => {
    skipCleanup(task.id);
    const app = await getAppSnapshot({
      url: `${viteSsrUrl}/en?pseudo=true`,
    });
    expect(app).toMatchSnapshot();
  });
});

describe('vite ssr translations build', () => {
  const prodUrl = 'http://localhost:8316';

  beforeAll(async () => {
    const distDir = fixturePath('dist');
    await rm(distDir, { recursive: true, force: true });

    const build = await sku('build', ['--config=sku.config.vite-ssr.ts']);
    await build.findByText('Sku build complete');
  });

  it('emits named vocab language chunks', async () => {
    const manifestPath = path.join(
      fixturePath('dist'),
      'server',
      'manifest.json',
    );
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<
      string,
      { file: string; name?: string }
    >;

    const languageChunks = Object.values(manifest).filter(
      (chunk) =>
        chunk.name === 'en-translations' || chunk.name === 'fr-translations',
    );
    expect(languageChunks.map((chunk) => chunk.name).sort()).toEqual([
      'en-translations',
      'fr-translations',
    ]);
  });

  it('modulepreloads the active language vocab chunk from the server entry', async ({
    task,
  }) => {
    skipCleanup(task.id);
    await node(['dist/server/server.js'], {
      spawnOpts: {
        env: { ...process.env, PORT: '8316' },
      },
    });

    await waitFor(
      async () => {
        const response = await fetch(`${prodUrl}/en`);
        expect(response.ok).toBe(true);
        const html = await response.text();
        expect(html).toContain('rel="modulepreload"');
        expect(html).toMatch(/en-translations[^"]*\.js/);
      },
      { timeout: 15000 },
    );
  });
});
