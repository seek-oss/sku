import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { getAppSnapshot } from '@sku-private/puppeteer';
import fs from 'node:fs/promises';

import {
  cleanup,
  scopeToFixture,
  skipCleanup,
} from '@sku-private/testing-library';

const { sku, fixturePath, node, exec } = scopeToFixture('ssr-hello-world');

describe('ssr-hello-world', () => {
  describe('start', () => {
    const url = `http://localhost:8101`;

    beforeAll(async () => {
      const start = await sku('start-ssr', ['--config=sku-start.config.ts']);
      expect(await start.findByText('Server started')).toBeInTheConsole();
    });

    afterAll(cleanup);

    it('should start a development server', async ({ task }) => {
      skipCleanup(task.id);
      const snapshot = await getAppSnapshot({ url, expect });
      expect(snapshot).toMatchSnapshot();
    });

    it('should respond to dev middleware route request', async ({ task }) => {
      skipCleanup(task.id);
      const { sourceHtml } = await getAppSnapshot({
        url: `${url}/test-middleware`,
        expect,
      });
      expect(sourceHtml).toBe('OK');
    });

    it('should respond to dev middleware static asset request', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const { sourceHtml } = await getAppSnapshot({
        url: `${url}/assets/logo.png`,
        expect,
      });
      expect(sourceHtml).toMatch(/^�PNG/);
    });
  });

  describe('build', () => {
    const url = `http://localhost:8001`;

    beforeAll(async () => {
      const build = await sku('build-ssr', ['--config=sku-build.config.ts']);
      expect(await build.findByText('Sku build complete')).toBeInTheConsole();
    });

    describe('default port', () => {
      it('should generate a production server based on config', async () => {
        await node(['dist-build/server.cjs']);

        const assetServer = await exec('pnpm', ['run', 'start:asset-server']);
        expect(
          await assetServer.findByText('serving dist-build'),
        ).toBeInTheConsole();

        const snapshot = await getAppSnapshot({ url, expect });
        expect(snapshot).toMatchSnapshot();
      });

      it("should invoke the provided 'onStart' callback", async () => {
        const server = await node(['dist-build/server.cjs']);
        expect(
          await server.findByText('Server ran the onStart callback'),
        ).toBeInTheConsole();
      });
    });

    it('should run on a custom port', async () => {
      const customPort = '7654';
      const customPortUrl = `http://localhost:${customPort}`;

      const server = await node([
        'dist-build/server.cjs',
        '--port',
        customPort,
      ]);
      expect(
        await server.findByText(`Server started on port ${customPort}`),
      ).toBeInTheConsole();

      const assetServer = await exec('pnpm', ['run', 'start:asset-server']);
      expect(
        await assetServer.findByText('serving dist-build'),
      ).toBeInTheConsole();

      const snapshot = await getAppSnapshot({ url: customPortUrl, expect });
      expect(snapshot).toMatchSnapshot();
    });

    it('should copy all public assets to the target folder', async () => {
      const files = await fs.readdir(fixturePath('dist-build'));
      expect(files).toContain('logo.png');
      expect(files).toContain('logo2.png');
      expect(files).toContain('foo');

      const fooFiles = await fs.readdir(fixturePath('dist-build/foo'));
      expect(fooFiles).toContain('logo.png');
      expect(fooFiles).toContain('bar');

      const barFiles = await fs.readdir(fixturePath('dist-build/foo/bar'));
      expect(barFiles).toContain('logo.png');
    });
  });
});
