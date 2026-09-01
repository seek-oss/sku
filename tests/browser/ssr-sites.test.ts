import { describe, beforeAll, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  scopeToFixture,
  skipCleanup,
  waitFor,
} from '@sku-private/testing-library';
import { createPage } from '@sku-private/playwright';

const { sku, node, fixturePath } = scopeToFixture('ssr-sites');

describe('ssr-sites', () => {
  describe('start', () => {
    const url = 'http://127.0.0.1:8216';

    beforeAll(async () => {
      const start = await sku('start', ['--config=sku.config.ts']);
      await start.findByText('Starting development server');
    });

    it('selects site-scoped routes from getSite', async ({ task }) => {
      skipCleanup(task.id);

      const auOnly = await fetch(`${url}/au-only`);
      expect(auOnly.ok).toBe(true);
      expect(await auOnly.text()).toContain('data-testid="au-only-page"');

      const foreignOnAu = await fetch(`${url}/nz-only`);
      const foreignHtml = await foreignOnAu.text();
      expect(foreignHtml).not.toContain('data-testid="nz-only-page"');
      expect(foreignHtml).not.toContain('NZ only');

      const nzOnly = await fetch(`${url}/nz-only`, {
        headers: { 'x-sku-site': 'nz' },
      });
      expect(nzOnly.ok).toBe(true);
      const nzHtml = await nzOnly.text();
      expect(nzHtml).toContain('data-testid="nz-only-page"');
      expect(nzHtml).toContain('__SKU_SITE__="nz"');
      expect(nzHtml).not.toContain('data-testid="au-only-page"');
    });

    it('serves mapRoutePath clones for /about and /au/about on AU', async ({
      task,
    }) => {
      skipCleanup(task.id);

      const about = await fetch(`${url}/about`);
      expect(about.ok).toBe(true);
      expect(await about.text()).toContain('data-testid="about"');

      const prefixed = await fetch(`${url}/au/about`);
      expect(prefixed.ok).toBe(true);
      expect(await prefixed.text()).toContain('data-testid="about"');

      // NZ does not expand about — /au/about is absent from the NZ tree.
      const foreignPrefixed = await fetch(`${url}/au/about`, {
        headers: { 'x-sku-site': 'nz' },
      });
      const foreignHtml = await foreignPrefixed.text();
      expect(foreignHtml).not.toContain('data-testid="about"');

      const nzAbout = await fetch(`${url}/about`, {
        headers: { 'x-sku-site': 'nz' },
      });
      expect(nzAbout.ok).toBe(true);
      expect(await nzAbout.text()).toContain('data-testid="about"');
    });

    it('serves mapRoutePath index home clones for / and /au on AU', async ({
      task,
    }) => {
      skipCleanup(task.id);

      const home = await fetch(`${url}/`);
      expect(home.ok).toBe(true);
      expect(await home.text()).toContain('data-testid="shell"');

      const prefixed = await fetch(`${url}/au`);
      expect(prefixed.ok).toBe(true);
      const prefixedHtml = await prefixed.text();
      expect(prefixedHtml).toContain('data-testid="shell"');
      expect(prefixedHtml).toContain('SSR Sites Home -');
      expect(prefixedHtml).toContain('__SKU_SITE__="au"');

      // NZ does not expand the index home — /au is absent from the NZ tree.
      const foreignPrefixed = await fetch(`${url}/au`, {
        headers: { 'x-sku-site': 'nz' },
      });
      const foreignHtml = await foreignPrefixed.text();
      expect(foreignHtml).not.toContain('data-testid="shell"');
    });

    it('hydrates the document with the selected site', async ({ task }) => {
      skipCleanup(task.id);
      const page = await createPage();
      const pageErrors: Error[] = [];
      page.on('pageerror', (error) => pageErrors.push(error));

      await page.goto(url, { waitUntil: 'networkidle' });
      await page.getByTestId('shell').waitFor({ state: 'visible' });
      expect(await page.getByTestId('shell').textContent()).toBe(
        'SSR Sites Home - au',
      );
      expect(pageErrors).toEqual([]);
      await page.close();
    });
  });

  describe('build', () => {
    beforeAll(async () => {
      const build = await sku('build', ['--config=sku.config.ts']);
      await expect(build).toMatchExitCode(0);
    });

    it('serialises site into the bootstrap', async ({ task }) => {
      skipCleanup(task.id);
      await node(['dist/server/server.js'], {
        spawnOpts: {
          env: { ...process.env, PORT: '8217' },
        },
      });

      await waitFor(
        async () => {
          const response = await fetch('http://127.0.0.1:8217/');
          expect(response.ok).toBe(true);
          const html = await response.text();
          expect(html).toContain('__SKU_SITE__="au"');
        },
        { timeout: 15000 },
      );
    });

    it('preloads a lazy route chunk on nav link hover', async ({ task }) => {
      skipCleanup(task.id);
      const manifestPath = path.join(
        fixturePath('dist'),
        'server',
        'manifest.json',
      );
      const manifest = JSON.parse(
        await fs.readFile(manifestPath, 'utf8'),
      ) as Record<string, { file: string }>;
      const aboutChunk = manifest['src/pages/about/about.tsx']?.file;
      const nzOnlyChunk = manifest['src/pages/nz-only/nz-only.tsx']?.file;
      expect(aboutChunk).toBeTruthy();
      expect(nzOnlyChunk).toBeTruthy();

      const page = await createPage();
      const aboutRequests: string[] = [];
      const nzOnlyRequests: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes(aboutChunk)) {
          aboutRequests.push(request.url());
        }
        if (request.url().includes(nzOnlyChunk)) {
          nzOnlyRequests.push(request.url());
        }
      });

      await page.goto('http://127.0.0.1:8217/', { waitUntil: 'networkidle' });
      await page.getByTestId('shell').waitFor({ state: 'visible' });
      expect(aboutRequests).toEqual([]);

      await page.getByTestId('nav-about').hover();
      await waitFor(
        () => {
          expect(aboutRequests.length).toBeGreaterThan(0);
        },
        { timeout: 5000 },
      );

      // `/nz-only` is absent from the AU tree, so intent preloading never matches it
      await page.getByTestId('nav-nz-only').hover();
      await page.getByTestId('nav-about').click();
      await page.getByTestId('about').waitFor({ state: 'visible' });
      expect(nzOnlyRequests).toEqual([]);
      await page.close();
    });
  });
});
