import { describe, beforeAll, it, expect } from 'vitest';
import { getAppSnapshot } from '@sku-private/playwright';
import fs from 'node:fs/promises';
import net from 'node:net';

import {
  scopeToFixture,
  skipCleanup,
  waitFor,
} from '@sku-private/testing-library';

const { sku, fixturePath, node, exec } = scopeToFixture('ssr-hello-world');

// Probe whether a TCP port is accepting connections.
// Used instead of `fetch` so it's agnostic to https/http.
const isPortListening = (port: number) =>
  new Promise<boolean>((resolve) => {
    const socket = net
      .connect(port, 'localhost')
      .once('connect', () => {
        socket.destroy();
        resolve(true);
      })
      .once('error', () => {
        socket.destroy();
        resolve(false);
      });
  });

describe('ssr-hello-world', () => {
  describe('start', () => {
    const url = `https://localhost:8101`;

    beforeAll(async () => {
      const start = await sku('start-ssr', ['--config=sku-start.config.ts']);
      await start.findByText('Server started');
    });

    it('should start a development server', async ({ task }) => {
      skipCleanup(task.id);
      const snapshot = await getAppSnapshot({ url });
      expect(snapshot).toMatchSnapshot();
    });

    it('should respond to dev middleware route request', async ({ task }) => {
      skipCleanup(task.id);
      const { sourceHtml } = await getAppSnapshot({
        url: `${url}/test-middleware`,
      });
      expect(sourceHtml).toBe('OK');
    });

    it('should respond to dev middleware static asset request', async ({
      task,
    }) => {
      skipCleanup(task.id);
      const { sourceHtml } = await getAppSnapshot({
        url: `${url}/assets/logo.png`,
      });
      expect(sourceHtml).toMatch(/^�PNG/);
    });
  });

  describe('build', () => {
    const url = `http://localhost:8001`;

    beforeAll(async () => {
      const build = await sku('build-ssr', ['--config=sku-build.config.ts']);
      await build.findByText('Sku build complete');
    });

    describe('default port', () => {
      it('should generate a production server based on config', async () => {
        await node(['dist/server.cjs']);

        const assetServer = await exec('pnpm', ['run', 'start:asset-server']);
        expect(await assetServer.findByText('serving dist')).toBeInTheConsole();

        const snapshot = await getAppSnapshot({ url });
        expect(snapshot).toMatchSnapshot();
      });

      it("should invoke the provided 'onStart' callback", async () => {
        const server = await node(['dist/server.cjs']);
        expect(
          await server.findByText('Server ran the onStart callback'),
        ).toBeInTheConsole();
      });
    });

    it('should run on a custom port', async () => {
      const customPort = '7654';
      const customPortUrl = `http://localhost:${customPort}`;

      const server = await node(['dist/server.cjs', '--port', customPort]);
      expect(
        await server.findByText(`Server started on port ${customPort}`),
      ).toBeInTheConsole();

      const assetServer = await exec('pnpm', ['run', 'start:asset-server']);
      expect(await assetServer.findByText('serving dist')).toBeInTheConsole();

      const snapshot = await getAppSnapshot({ url: customPortUrl });
      expect(snapshot).toMatchSnapshot();
    });

    it('should copy all public assets to the target folder', async () => {
      const files = await fs.readdir(fixturePath('dist'));
      expect(files).toContain('logo.png');
      expect(files).toContain('logo2.png');
      expect(files).toContain('foo');

      const fooFiles = await fs.readdir(fixturePath('dist/foo'));
      expect(fooFiles).toContain('logo.png');
      expect(fooFiles).toContain('bar');

      const barFiles = await fs.readdir(fixturePath('dist/foo/bar'));
      expect(barFiles).toContain('logo.png');
    });
  });
});

describe.each(['SIGINT', 'SIGTERM', 'SIGQUIT'] as const)(
  'start-ssr teardown on %s',
  (signal) => {
    it('kills the SSR server worker and frees the port', async () => {
      const nodeServerPort = 8100;
      const devServerPort = 8101;

      // Spawn detached so we can signal the whole process group below. The
      // command runs via a shell that doesn't forward signals to sku on Linux.
      const start = await sku('start-ssr', ['--config=sku-start.config.ts'], {
        spawnOpts: { detached: true },
      });
      await start.findByText('Server started');

      expect(await isPortListening(nodeServerPort)).toBe(true);
      expect(await isPortListening(devServerPort)).toBe(true);

      const { pid } = start.process;
      if (!pid) {
        throw new Error('start-ssr process has no pid');
      }
      // A negative pid signals the whole process group.
      process.kill(-pid, signal);

      await waitFor(async () => {
        expect(await isPortListening(nodeServerPort)).toBe(false);
        expect(await isPortListening(devServerPort)).toBe(false);
      });

      await waitFor(() => expect(start.hasExit()).not.toBeNull());
    });
  },
);
