import { describe, beforeAll, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  scopeToFixture,
  skipCleanup,
  waitFor,
} from '@sku-private/testing-library';
import { createPage } from '@sku-private/playwright';

const { sku, node, fixturePath } = scopeToFixture('ssr-document');

describe('ssr-document', () => {
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
      expect(html).toContain('SSR Home');
      expect(html).not.toContain('id="app"');
      // Shell-first Suspense: fallback appears, then deferred content streams in.
      expect(html).toContain('data-testid="fallback"');
      expect(html).toContain('Deferred content ready');
      // Start serves Vite bootstrap from `/` (ignores config publicPath).
      expect(html).not.toContain('/static/ssr-document/');
      expect(html).toContain('ssr-client');
      expect(html).toContain('/@vite/client');

      const viteClient = await fetch(`${url}/@vite/client`);
      expect(viteClient.ok).toBe(true);
      expect(viteClient.headers.get('content-type')).toMatch(/javascript/);
      expect(await viteClient.text()).not.toContain('<!DOCTYPE html>');

      const csp = response.headers.get('content-security-policy');
      const cspReportOnly = response.headers.get(
        'content-security-policy-report-only',
      );
      expect(csp).toBeTruthy();
      expect(cspReportOnly).toBeTruthy();
      expect(csp).toContain('https://cdn.example.com');
      expect(cspReportOnly).toContain('https://report-only.example.com');
      expect(csp).toContain('report-to csp-endpoint');
      expect(cspReportOnly).toContain('report-to csp-report-only-endpoint');
      // Only `cspReportTo` carries a URL, so only it appears in the header.
      expect(response.headers.get('reporting-endpoints')).toBe(
        'csp-endpoint="https://report.example.com/csp"',
      );
      // sku mints a nonce when attaching it to React stream scripts.
      expect(csp).toMatch(/'nonce-/);
      expect(cspReportOnly).toMatch(/'nonce-/);
    });

    it('includes the SSR-CSS virtual stylesheet without transformIndexHtml', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const response = await fetch(url);
      const html = await response.text();

      // Document assets.css emits the virtual stylesheet (not transformIndexHtml).
      expect(html).toContain('/@id/__x00__virtual:ssr-css.css');
      expect(html).toContain('data-ssr-css');
      // transformIndexHtml artifacts from static Vite must not appear inline.
      expect(html).not.toContain('__clear_ssr_css');
      expect(html).not.toContain('sku:initialPageLoad');
      expect(html).not.toContain('sku:vite-hmr');

      const ssrCss = await fetch(`${url}/@id/__x00__virtual:ssr-css.css`);
      expect(ssrCss.ok).toBe(true);
      // Eager layout Vanilla Extract CSS is reachable from the SSR module graph.
      expect(await ssrCss.text()).toContain('sku-ssr-document-layout');
    });

    it('wires start telemetry clients via the browser client entry', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const response = await fetch(url);
      const html = await response.text();

      // Client entry path is in bootstrapModules (not transformIndexHtml scripts).
      const clientEntryMatch = html.match(/\/@fs\/[^"']+ssr-client\.dev[^"']*/);
      const clientEntryPath = clientEntryMatch?.[0];
      expect(clientEntryPath).toBeTruthy();
      if (!clientEntryPath) {
        throw new Error('Expected client entry path in HTML');
      }

      const clientEntry = await fetch(`${url}${clientEntryPath}`);
      expect(clientEntry.ok).toBe(true);
      const clientSource = await clientEntry.text();

      // Dev entry imports telemetryClients + SSR-CSS HMR cleanup.
      expect(clientSource).toMatch(/telemetryClients/);
      expect(clientSource).toContain('data-ssr-css');

      // Resolved telemetry module sends WS events via shared event constants.
      const telemetryModuleMatch = clientSource.match(
        /(?:from|import)\s*["']([^"']*telemetryClients[^"']*)["']/,
      );
      const telemetryModulePath = telemetryModuleMatch?.[1];
      expect(telemetryModulePath).toBeTruthy();
      if (!telemetryModulePath) {
        throw new Error('Expected telemetryClients import in client entry');
      }

      const telemetryUrl = telemetryModulePath.startsWith('/')
        ? `${url}${telemetryModulePath}`
        : new URL(telemetryModulePath, `${url}${clientEntryPath}`).href;
      const telemetrySource = await fetch(telemetryUrl).then((r) => r.text());
      expect(telemetrySource).toContain('SKU_INITIAL_PAGE_LOAD_EVENT');
      expect(telemetrySource).toContain('SKU_VITE_HMR_EVENT');

      const eventsModuleMatch = telemetrySource.match(
        /(?:from|import)\s*["']([^"']*telemetryEvents[^"']*)["']/,
      );
      const eventsModulePath = eventsModuleMatch?.[1];
      expect(eventsModulePath).toBeTruthy();
      if (!eventsModulePath) {
        throw new Error('Expected telemetryEvents import in telemetry module');
      }
      const eventsUrl = eventsModulePath.startsWith('/')
        ? `${url}${eventsModulePath}`
        : new URL(eventsModulePath, telemetryUrl).href;
      const eventsSource = await fetch(eventsUrl).then((r) => r.text());
      expect(eventsSource).toContain('sku:initialPageLoad');
      expect(eventsSource).toContain('sku:vite-hmr');
    });

    it('hydrates the document in the browser', async ({ task }) => {
      skipCleanup(task.id);
      const page = await createPage();
      const pageErrors: Error[] = [];
      page.on('pageerror', (error) => pageErrors.push(error));

      await page.goto(url, { waitUntil: 'networkidle' });
      await page.getByTestId('deferred').waitFor({ state: 'visible' });
      expect(await page.getByTestId('shell').textContent()).toBe('SSR Home');
      expect(await page.getByTestId('deferred').textContent()).toBe(
        'Deferred content ready',
      );
      expect(pageErrors).toEqual([]);
      await page.close();
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

    it('renders lazy routes', async ({ task }) => {
      skipCleanup(task.id);
      const about = await fetch(`${url}/about`);
      expect(about.ok).toBe(true);
      const aboutHtml = await about.text();
      expect(aboutHtml).toContain('About');
      // Start ignores publicPath; production still serves assets under it.
      expect(aboutHtml).not.toContain('/static/ssr-document/');
      expect(aboutHtml).toContain('/@vite/client');

      const details = await fetch(`${url}/details`);
      expect(details.ok).toBe(true);
      expect(await details.text()).toContain('Details');
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
      expect(await page.getByTestId('shell').textContent()).toBe('SSR Home');
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
      const bakedManifest = path.join(serverDir, 'manifest.json');
      const serverEntry = path.join(serverDir, 'server.js');

      expect((await fs.stat(clientDir)).isDirectory()).toBe(true);
      expect((await fs.stat(serverDir)).isDirectory()).toBe(true);
      expect((await fs.stat(bakedManifest)).isFile()).toBe(true);
      expect((await fs.stat(serverEntry)).isFile()).toBe(true);

      // Neither nested in the other; client assets are not at dist root.
      // Manifest lives under server/ only — not a public non-hashed client file.
      const distEntries = await fs.readdir(dist);
      expect(distEntries.sort()).toEqual(['client', 'server']);
      expect(await fs.readdir(clientDir)).not.toContain('manifest.json');
    });

    it('emits distinct client chunks for lazy routes', async () => {
      const manifestPath = path.join(
        fixturePath('dist'),
        'server',
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
          expect(html).toContain('SSR Home');
          expect(html).toContain('<!DOCTYPE html>');
          expect(html).toContain('/static/ssr-document/');
          expect(response.headers.get('content-security-policy')).toContain(
            'report-to csp-endpoint',
          );
          const cspReportOnly = response.headers.get(
            'content-security-policy-report-only',
          );
          expect(cspReportOnly).toContain('report-to csp-report-only-endpoint');
          expect(response.headers.get('reporting-endpoints')).toBe(
            'csp-endpoint="https://report.example.com/csp"',
          );
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
  });
});
