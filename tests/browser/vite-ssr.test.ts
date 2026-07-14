import { describe, beforeAll, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  scopeToFixture,
  skipCleanup,
  waitFor,
} from '@sku-private/testing-library';
import { createPage } from '@sku-private/playwright';

const { sku, node, fixturePath } = scopeToFixture('vite-ssr');

describe('vite-ssr', () => {
  describe('config validation', () => {
    it('rejects webpack + server-side-rendered', async () => {
      const process = await sku('start', [
        '--config=sku.config.webpack-ssr-error.ts',
      ]);

      expect(
        await process.findByText('renderType: server-side-rendered'),
      ).toBeInTheConsole();

      await waitFor(() => {
        expect(process.hasExit()).toMatchObject({ exitCode: 1 });
      });
    });

    it('rejects start-ssr when renderType is set', async () => {
      const process = await sku('start-ssr', [
        '--config=sku.config.ssr-command-error.ts',
      ]);

      expect(
        await process.findByError(
          '`sku start-ssr` is not used with `renderType`. Use `sku start` instead.',
        ),
      ).toBeInTheConsole();

      await waitFor(() => {
        expect(process.hasExit()).toMatchObject({ exitCode: 1 });
      });
    });

    it('rejects build-ssr when renderType is set', async () => {
      const process = await sku('build-ssr', [
        '--config=sku.config.ssr-command-error.ts',
      ]);

      expect(
        await process.findByError(
          '`sku build-ssr` is not used with `renderType`. Use `sku build` instead.',
        ),
      ).toBeInTheConsole();

      await waitFor(() => {
        expect(process.hasExit()).toMatchObject({ exitCode: 1 });
      });
    });

    it('rejects absolute publicPath for Vite SSR', async () => {
      const process = await sku('start', [
        '--config=sku.config.absolute-public-path-error.ts',
      ]);

      expect(
        await process.findByText('Vite SSR requires a relative'),
      ).toBeInTheConsole();
      expect(await process.findByText('publicPath')).toBeInTheConsole();

      await waitFor(() => {
        expect(process.hasExit()).toMatchObject({ exitCode: 1 });
      });
    });
  });

  describe('start', () => {
    const url = 'http://127.0.0.1:8200';

    beforeAll(async () => {
      const start = await sku('start', ['--config=sku.config.ts']);
      await start.findByText('Starting development server');
    });

    it('streams the document shell with CSP headers', async ({ task }) => {
      skipCleanup(task.id);
      const response = await fetch(url);
      const html = await response.text();

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('Vite SSR Home');
      expect(html).not.toContain('id="app"');
      // Shell-first Suspense: fallback appears, then deferred content streams in.
      expect(html).toContain('data-testid="fallback"');
      expect(html).toContain('Deferred content ready');
      // No transformIndexHtml: client entry is bootstrapped explicitly.
      expect(html).toContain('vite-ssr-client');
      expect(html).toContain('@vite/client');

      const csp = response.headers.get('content-security-policy');
      const cspReportOnly = response.headers.get(
        'content-security-policy-report-only',
      );
      expect(csp).toBeTruthy();
      expect(cspReportOnly).toBeTruthy();
      expect(csp).toContain('https://cdn.example.com');
      expect(cspReportOnly).toContain('https://report-only.example.com');
      expect(cspReportOnly).toContain('report-to csp-endpoint');
      expect(csp).not.toContain('report-to');
      // sku mints a nonce when attaching it to React stream scripts.
      expect(csp).toMatch(/'nonce-/);
      expect(cspReportOnly).toMatch(/'nonce-/);
    });

    it('hydrates the document in the browser', async ({ task }) => {
      skipCleanup(task.id);
      const page = await createPage();
      const pageErrors: Error[] = [];
      page.on('pageerror', (error) => pageErrors.push(error));

      await page.goto(url, { waitUntil: 'networkidle' });
      await page.getByTestId('deferred').waitFor({ state: 'visible' });
      expect(await page.getByTestId('shell').textContent()).toBe(
        'Vite SSR Home',
      );
      expect(await page.getByTestId('deferred').textContent()).toBe(
        'Deferred content ready',
      );
      expect(pageErrors).toEqual([]);
      await page.close();
    });

    it('serves consumer middleware before HTML render', async ({ task }) => {
      skipCleanup(task.id);
      const response = await fetch(`${url}/api/health`);
      expect(await response.text()).toBe('ok');
    });

    it('serves config devServerMiddleware before server-entry middleware', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const response = await fetch(`${url}/mock-api`);
      expect(response.ok).toBe(true);
      expect(await response.text()).toBe('sku-vite-ssr-dev-mock');
    });

    it('exposes the request CSP nonce to middleware and loaders', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const nonceResponse = await fetch(`${url}/api/nonce`);
      const middlewareNonce = await nonceResponse.text();
      expect(middlewareNonce.length).toBeGreaterThan(8);

      const page = await fetch(`${url}/nonce`);
      const html = await page.text();
      const csp = page.headers.get('content-security-policy') ?? '';
      const nonces = [...csp.matchAll(/'nonce-([^']+)'/g)].map((m) => m[1]);
      expect(nonces).toHaveLength(1);
      const nonce = nonces[0];
      expect(html).toContain('Nonce page');
      // Loader serialized the same request nonce into hydration data.
      expect(html).toContain(`"nonce":"${nonce}"`);
      expect(csp).toContain(`'nonce-${nonce}'`);
    });

    it('forwards loader Set-Cookie headers on HTML responses', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const response = await fetch(`${url}/set-cookie`);
      expect(response.ok).toBe(true);
      expect(await response.text()).toContain('Cookie page');
      const setCookie = response.headers.getSetCookie?.() ?? [];
      const cookieHeader =
        setCookie.length > 0
          ? setCookie.join('\n')
          : (response.headers.get('set-cookie') ?? '');
      expect(cookieHeader).toContain('sku-vite-ssr=1');
    });

    it('renders lazy routes', async ({ task }) => {
      skipCleanup(task.id);
      const about = await fetch(`${url}/about`);
      expect(await about.text()).toContain('About');

      const details = await fetch(`${url}/details`);
      expect(await details.text()).toContain('Details');
    });

    it('renders a translated route for a language param', async ({ task }) => {
      skipCleanup(task.id);
      const response = await fetch(`${url}/en/hello`);
      const html = await response.text();
      expect(html).toContain('Hello from Vite SSR');
    });

    it('forwards loader redirect Responses', async ({ task }) => {
      skipCleanup(task.id);
      const response = await fetch(`${url}/redirect`, { redirect: 'manual' });
      expect(response.status).toBeGreaterThanOrEqual(300);
      expect(response.status).toBeLessThan(400);
      expect(response.headers.get('location')).toBe('/about');
    });

    it('buffers until onAllReady when handle.waitForAll is set', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const response = await fetch(`${url}/buffered`);
      const html = await response.text();
      expect(html).toContain('Buffered page');
      expect(html).toContain('Buffered content ready');
      // Wait-for-all: Suspense fallback should not appear in the final HTML.
      expect(html).not.toContain('data-testid="buffered-fallback"');
    });

    it('runs JSON POST actions after async middleware', async ({ task }) => {
      skipCleanup(task.id);
      const response = await fetch(`${url}/action`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hello: 'world' }),
      });
      const html = await response.text();
      expect(response.ok).toBe(true);
      // Text nodes escape quotes; assert both the visible result and hydration payload.
      expect(html).toContain('json:{&quot;hello&quot;:&quot;world&quot;}');
      expect(html).toContain('"type":"json"');
      expect(html).toContain('"hello":"world"');
    });

    it('runs urlencoded form POST actions', async ({ task }) => {
      skipCleanup(task.id);
      const response = await fetch(`${url}/action`, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: 'message=from-form',
      });
      const html = await response.text();
      expect(response.ok).toBe(true);
      expect(html).toContain('form:from-form');
    });

    it('returns 405 when POSTing to a route without an action', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const response = await fetch(`${url}/set-cookie`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ noop: true }),
      });
      expect(response.status).toBe(405);
    });
  });

  describe('start with httpsDevServer', () => {
    const url = 'https://127.0.0.1:8202';
    let startOutput: Awaited<ReturnType<typeof sku>>;

    beforeAll(async () => {
      startOutput = await sku('start', ['--config=sku.config.https.ts']);
    });

    it('prints https URLs and serves document responses over HTTPS', async ({
      task,
    }) => {
      skipCleanup(task.id);
      await startOutput.findByText('Starting development server');
      expect(await startOutput.findByText('https://')).toBeInTheConsole();

      const page = await createPage();
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.getByTestId('shell').waitFor({ state: 'visible' });
      expect(await page.getByTestId('shell').textContent()).toBe(
        'Vite SSR Home',
      );
      await page.close();
    });
  });

  describe('build', () => {
    beforeAll(async () => {
      const build = await sku('build', ['--config=sku.config.ts']);
      await build.findByText('Sku build complete');
    });

    it('emits sibling client/ and server/ under the build target', async () => {
      const dist = fixturePath('dist');
      const clientDir = path.join(dist, 'client');
      const serverDir = path.join(dist, 'server');
      const manifest = path.join(clientDir, '.vite', 'manifest.json');
      const serverEntry = path.join(serverDir, 'server.js');

      expect((await fs.stat(clientDir)).isDirectory()).toBe(true);
      expect((await fs.stat(serverDir)).isDirectory()).toBe(true);
      expect((await fs.stat(manifest)).isFile()).toBe(true);
      expect((await fs.stat(serverEntry)).isFile()).toBe(true);

      // Neither nested in the other; client assets are not at dist root.
      const distEntries = await fs.readdir(dist);
      expect(distEntries.sort()).toEqual(['client', 'server']);
      expect(distEntries).not.toContain('.vite');
    });

    it('emits distinct client chunks for lazy routes', async () => {
      const manifestPath = path.join(
        fixturePath('dist'),
        'client',
        '.vite',
        'manifest.json',
      );
      const manifest = JSON.parse(
        await fs.readFile(manifestPath, 'utf8'),
      ) as Record<string, { file: string; name?: string }>;

      const about = manifest['src/pages/about/about.tsx'];
      const details = manifest['src/pages/details/details.tsx'];
      expect(about?.file).toBeTruthy();
      expect(details?.file).toBeTruthy();
      expect(about.file).not.toBe(details.file);
    });

    it('emits named vocab language chunks', async () => {
      const manifestPath = path.join(
        fixturePath('dist'),
        'client',
        '.vite',
        'manifest.json',
      );
      const manifest = JSON.parse(
        await fs.readFile(manifestPath, 'utf8'),
      ) as Record<string, { file: string; name?: string }>;

      const languageChunks = Object.values(manifest).filter(
        (chunk) =>
          chunk.name === 'en-translations' || chunk.name === 'fr-translations',
      );
      expect(languageChunks.map((chunk) => chunk.name).sort()).toEqual([
        'en-translations',
        'fr-translations',
      ]);
    });

    it('produces a runnable production server', async ({ task }) => {
      skipCleanup(task.id);
      await node(['dist/server/server.js'], {
        spawnOpts: {
          env: { ...process.env, PORT: '8201' },
        },
      });

      await waitFor(
        async () => {
          const response = await fetch('http://127.0.0.1:8201/');
          expect(response.ok).toBe(true);
          const html = await response.text();
          expect(html).toContain('Vite SSR Home');
          expect(html).toContain('<!DOCTYPE html>');
          expect(response.headers.get('content-security-policy')).toBeTruthy();
          const cspReportOnly = response.headers.get(
            'content-security-policy-report-only',
          );
          expect(cspReportOnly).toContain('report-to csp-endpoint');
        },
        { timeout: 15000 },
      );
    });

    it('keeps config devServerMiddleware out of the production server', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const serverEntry = await fs.readFile(
        path.join(fixturePath('dist'), 'server', 'server.js'),
        'utf8',
      );
      expect(serverEntry).not.toContain('sku-vite-ssr-dev-mock');
      expect(serverEntry).not.toContain('dev-middleware');

      await waitFor(
        async () => {
          // Production still serves server-entry middleware…
          const health = await fetch('http://127.0.0.1:8201/api/health');
          expect(await health.text()).toBe('ok');
          // …but not the start-only mock route.
          const mock = await fetch('http://127.0.0.1:8201/mock-api');
          expect(mock.status).not.toBe(200);
          expect(await mock.text()).not.toContain('sku-vite-ssr-dev-mock');
        },
        { timeout: 15000 },
      );
    });

    it('emits modulepreload for auto-derived lazy route moduleIds', async ({
      task,
    }) => {
      skipCleanup(task.id);
      await waitFor(
        async () => {
          const response = await fetch('http://127.0.0.1:8201/about');
          expect(response.ok).toBe(true);
          const html = await response.text();
          expect(html).toContain('rel="modulepreload"');
          expect(html).toContain('About');
        },
        { timeout: 15000 },
      );
    });

    it('modulepreloads the active language vocab chunk from the server entry', async ({
      task,
    }) => {
      skipCleanup(task.id);
      await waitFor(
        async () => {
          const response = await fetch('http://127.0.0.1:8201/en/hello');
          expect(response.ok).toBe(true);
          const html = await response.text();
          expect(html).toContain('Hello from Vite SSR');
          expect(html).toContain('rel="modulepreload"');
          expect(html).toMatch(/en-translations[^"]*\.js/);
        },
        { timeout: 15000 },
      );
    });

    it('serialises clientContext from the server entry into the bootstrap', async ({
      task,
    }) => {
      skipCleanup(task.id);
      await waitFor(
        async () => {
          const response = await fetch('http://127.0.0.1:8201/');
          expect(response.ok).toBe(true);
          const html = await response.text();
          expect(html).toContain('__SKU_CLIENT_CONTEXT__');
          expect(html).toContain('"fromServer":true');
        },
        { timeout: 15000 },
      );
    });

    it('omits Error.stack from production hydration payload', async ({
      task,
    }) => {
      skipCleanup(task.id);
      await waitFor(
        async () => {
          const response = await fetch('http://127.0.0.1:8201/boom');
          expect(response.status).toBe(500);
          const html = await response.text();
          expect(html).toContain('__staticRouterHydrationData');
          expect(html).toContain('Boom from loader');
          const hydrationJson = html.match(
            /__staticRouterHydrationData=(\{.*?\})\s*(?:;|<\/script>)/s,
          )?.[1];
          expect(hydrationJson).toBeTruthy();
          const payload = JSON.parse(hydrationJson as string) as {
            errors: Record<string, { message?: string; stack?: string }>;
          };
          const error = Object.values(payload.errors ?? {})[0];
          expect(error?.message).toContain('Boom from loader');
          expect(error).not.toHaveProperty('stack');
        },
        { timeout: 15000 },
      );
    });

    it('forwards loader Set-Cookie on production HTML responses', async ({
      task,
    }) => {
      skipCleanup(task.id);
      await waitFor(
        async () => {
          const response = await fetch('http://127.0.0.1:8201/set-cookie');
          expect(response.ok).toBe(true);
          const setCookie = response.headers.getSetCookie?.() ?? [];
          const cookieHeader =
            setCookie.length > 0
              ? setCookie.join('\n')
              : (response.headers.get('set-cookie') ?? '');
          expect(cookieHeader).toContain('sku-vite-ssr=1');
        },
        { timeout: 15000 },
      );
    });
  });
});
