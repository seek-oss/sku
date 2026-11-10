import { describe, beforeAll, it, expect } from 'vitest';
import { createPage, getAppSnapshot } from '@sku-private/playwright';
import { getPort } from '@sku-private/test-utils';
import {
  bundlers,
  type BundlerValues,
  scopeToFixture,
  skipCleanup,
  waitFor,
} from '@sku-private/testing-library';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
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
      await expect(build).toMatchExitCode(0);

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
      // SSG prerenders English (`?pseudo` is ignored at render time) and
      // hydrates with that language. en-PSEUDO is loaded on the client after
      // hydration.
      expect(app.sourceHtml).toContain('Hello sku');
      expect(app.clientRenderContent).toContain('Ḩẽẽẽƚƚööö šķǚǚǚ');
      expect(app).toMatchSnapshot();
    });

    it('should support query parameters', async ({ task }) => {
      skipCleanup(task.id);
      const app = await getAppSnapshot({ url: `${baseUrl}/en?a=1` });
      expect(app).toMatchSnapshot();
    });
  });
});

describe('webpack ssr translations', () => {
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
    await expect(build).toMatchExitCode(0);
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
    await node(['dist/server/server.mjs'], {
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

  describe('standalone production server', () => {
    let standaloneUrl: string;

    beforeAll(async () => {
      const port = await getPort();
      standaloneUrl = `http://127.0.0.1:${port}`;

      const isolatedDir = await mkdtemp(
        path.join(os.tmpdir(), 'sku-translations-standalone-'),
      );
      await writeFile(
        path.join(isolatedDir, 'package.json'),
        JSON.stringify({ type: 'commonjs' }),
      );
      await cp(fixturePath('dist'), isolatedDir, { recursive: true });

      await node([path.join(isolatedDir, 'server', 'server.mjs')], {
        spawnOpts: {
          env: { ...process.env, PORT: String(port) },
        },
      });

      await waitFor(
        async () => {
          const response = await fetch(`${standaloneUrl}/en`);
          expect(response.ok).toBe(true);
        },
        { timeout: 15000 },
      );
    });

    it.for([
      { language: 'en', text: 'Hello sku' },
      { language: 'fr', text: 'Bonjour sku' },
    ])(
      'hydrates /$language without hydration errors',
      async ({ language, text }, { task }) => {
        skipCleanup(task.id);
        const page = await createPage();
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => {
          if (message.type() === 'error') {
            errors.push(message.text());
          }
        });

        await page.goto(`${standaloneUrl}/${language}`, {
          waitUntil: 'networkidle',
        });
        await page.waitForFunction(() => {
          const app = document.body.querySelector('div');
          return (
            app !== null &&
            Object.keys(app).some((key) => key.startsWith('__reactFiber$'))
          );
        });

        expect(
          await page.locator('body > div').first().textContent(),
        ).toContain(text);
        expect(errors).toEqual([]);
        await page.close();
      },
    );
  });
});
