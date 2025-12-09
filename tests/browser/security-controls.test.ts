import { describe, beforeAll, it, expect, beforeEach } from 'vitest';
import { getAppSnapshot } from '@sku-private/playwright';

import {
  bundlers,
  type BundlerValues,
  scopeToFixture,
} from '@sku-private/testing-library';
import { getPort } from '@sku-private/test-utils';
import { readFile } from 'node:fs/promises';
import { parse, type HTMLElement } from 'node-html-parser';

const { sku, fixturePath, node, exec } = scopeToFixture('security-controls');

describe('security-controls', () => {
  const args: BundlerValues<string[]> = {
    vite: ['--config', 'sku.config.vite.ts'],
    webpack: ['--config', 'sku.config.ts'],
  };

  describe.for(bundlers)('bundler %s', async (bundler) => {
    describe('start', async () => {
      const port = await getPort();
      const url = `http://localhost:${port}`;

      beforeAll(async () => {
        const start = await sku('start', [
          ...args[bundler],
          '--strict-port',
          `--port=${port}`,
        ]);
        await start.findByText('Starting development server');
      });

      it('should start an app with security controls', async () => {
        const app = await getAppSnapshot({
          url,
        });

        expect(app).toMatchSnapshot();
      });
    });

    describe('build', async () => {
      let cspTag: HTMLElement;

      beforeAll(async () => {
        const build = await sku('build', [...args[bundler]]);
        await build.findByText('Sku build complete');
      });

      beforeEach(async () => {
        const indexPath = fixturePath('dist/index.html');
        const content = await readFile(indexPath, 'utf-8');
        const root = parse(content);

        cspTag = root.querySelector(
          'meta[http-equiv="Content-Security-Policy"]',
        )!;
      });

      it('should generate a CSP meta tag', async () => {
        expect(cspTag).not.toBeNull();
      });

      it('should include the extra hosts in the CSP', async () => {
        expect(cspTag.getAttribute('content')).toContain(
          'https://some-cdn.com',
        );
      });

      it('should generate a CSP with nonce value', async () => {
        expect(cspTag!.getAttribute('content')).match(
          /nonce-([a-zA-Z0-9+/=]+)/,
        );
      });
    });
  });

  describe('build-ssr', async () => {
    const port = await getPort();
    const assetPort = await getPort();
    const url = `http://localhost:${port}`;

    beforeAll(async () => {
      const build = await sku('build-ssr', ['--config=sku-server.config.ts']);
      await build.findByText('Sku build complete');
    });

    it('should start a server with content-security-policies', async () => {
      await node(['dist-ssr/server.cjs', `--port=${port}`]);
      const assetServer = await exec('pnpm', [
        'run',
        'serve:assets',
        `--port=${assetPort}`,
      ]);
      expect(
        await assetServer.findByText('serving dist-ssr'),
      ).toBeInTheConsole();

      const app = await getAppSnapshot({ url });

      expect(app).toMatchSnapshot();
    });
  });
});
