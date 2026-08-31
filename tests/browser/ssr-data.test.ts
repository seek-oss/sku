import { describe, beforeAll, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  scopeToFixture,
  skipCleanup,
  waitFor,
} from '@sku-private/testing-library';
import { createPage } from '@sku-private/playwright';

const { sku, node, fixturePath } = scopeToFixture('ssr-data');

describe('ssr-data', () => {
  describe('start', () => {
    const url = 'http://127.0.0.1:8214';

    beforeAll(async () => {
      const start = await sku('start', ['--config=sku.config.ts']);
      await start.findByText('Starting development server');
    });

    it('serves consumer middleware before HTML render', async ({ task }) => {
      skipCleanup(task.id);
      const response = await fetch(`${url}/api/health`);
      expect(await response.text()).toBe('ok');
    });

    it('projects middleware-attached state into SkuProvider via getClientContext', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const apiUser = await fetch(`${url}/api/user`);
      expect(await apiUser.text()).toBe('fixture-user');

      const response = await fetch(url);
      const html = await response.text();
      expect(html).toContain('data-testid="providers-user-id"');
      expect(html).toContain('fixture-user');
      expect(html).toContain('"userId":"fixture-user"');
    });

    it('keeps SkuProvider values mounted across client navigations', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const page = await createPage();
      const pageErrors: Error[] = [];
      page.on('pageerror', (error) => pageErrors.push(error));

      await page.goto(url, { waitUntil: 'networkidle' });
      expect(await page.getByTestId('providers-user-id').textContent()).toBe(
        'fixture-user',
      );

      // SkuProvider sits outside the router, so seeds stay mounted across
      // navigations rather than being rebuilt per request.
      await page.getByTestId('nav-about').click();
      await page.getByTestId('about').waitFor({ state: 'visible' });
      await page.goBack();
      expect(await page.getByTestId('providers-user-id').textContent()).toBe(
        'fixture-user',
      );
      expect(pageErrors).toEqual([]);
      await page.close();
    });

    it('seeds loader context from server getRouterContext on document SSR', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const response = await fetch(`${url}/context-user`);
      const html = await response.text();
      expect(response.ok).toBe(true);
      expect(html).toContain('data-testid="context-user-id"');
      expect(html).toContain('fixture-user');
    });

    it('re-seeds loader context from client getRouterContext after client navigation', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const page = await createPage();
      const pageErrors: Error[] = [];
      page.on('pageerror', (error) => pageErrors.push(error));

      // Start on a different location than the context-user route.
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.getByTestId('shell').waitFor({ state: 'visible' });
      expect(await page.getByTestId('providers-user-id').textContent()).toBe(
        'fixture-user',
      );

      await page.getByTestId('nav-context-user').click();
      await page.getByTestId('context-user-page').waitFor({ state: 'visible' });
      expect(await page.getByTestId('context-user-id').textContent()).toBe(
        'fixture-user',
      );
      expect(pageErrors).toEqual([]);
      await page.close();
    });

    it('serves Vite module-graph URLs before catch-all server-entry middleware', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const viteClient = await fetch(`${url}/@vite/client`);
      const body = await viteClient.text();
      expect(viteClient.ok).toBe(true);
      expect(viteClient.headers.get('content-type')).toMatch(/javascript/);
      expect(body).not.toContain('middleware-handled');
      expect(body).not.toContain('<!DOCTYPE html>');
    });

    it('serves config devServerMiddleware before server-entry middleware', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const response = await fetch(`${url}/mock-api`);
      expect(response.ok).toBe(true);
      expect(await response.text()).toBe('sku-ssr-data-dev-mock');
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
      expect(cookieHeader).toContain('sku-ssr-data=1');
    });

    it('forwards loader redirect Responses', async ({ task }) => {
      skipCleanup(task.id);
      const response = await fetch(`${url}/redirect`, { redirect: 'manual' });
      expect(response.status).toBeGreaterThanOrEqual(300);
      expect(response.status).toBeLessThan(400);
      expect(response.headers.get('location')).toBe('/about');
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

  describe('build', () => {
    beforeAll(async () => {
      const build = await sku('build', ['--config=sku.config.ts']);
      await build.findByText('Sku build complete');
    });

    it('keeps config devServerMiddleware out of the production server', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const serverEntry = await fs.readFile(
        path.join(fixturePath('dist'), 'server', 'server.js'),
        'utf8',
      );
      expect(serverEntry).not.toContain('sku-ssr-data-dev-mock');
      expect(serverEntry).not.toContain('dev-middleware');

      await node(['dist/server/server.js'], {
        spawnOpts: {
          env: { ...process.env, PORT: '8215' },
        },
      });

      await waitFor(
        async () => {
          // Production still serves server-entry middleware…
          const health = await fetch('http://127.0.0.1:8215/api/health');
          expect(await health.text()).toBe('ok');
          // …but not the start-only mock route.
          const mock = await fetch('http://127.0.0.1:8215/mock-api');
          expect(mock.status).not.toBe(200);
          expect(await mock.text()).not.toContain('sku-ssr-data-dev-mock');
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
          const response = await fetch('http://127.0.0.1:8215/');
          expect(response.ok).toBe(true);
          const html = await response.text();
          expect(html).toContain('__SKU_CLIENT_CONTEXT__');
          expect(html).toContain('"fromServer":true');
          expect(html).toContain('"userId":"fixture-user"');
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
          const response = await fetch('http://127.0.0.1:8215/set-cookie');
          expect(response.ok).toBe(true);
          const setCookie = response.headers.getSetCookie?.() ?? [];
          const cookieHeader =
            setCookie.length > 0
              ? setCookie.join('\n')
              : (response.headers.get('set-cookie') ?? '');
          expect(cookieHeader).toContain('sku-ssr-data=1');
        },
        { timeout: 15000 },
      );
    });
  });
});
