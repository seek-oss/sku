import {
  describe,
  beforeAll,
  afterAll,
  it,
  expect as globalExpect,
} from 'vitest';
import { getAppSnapshot } from '@sku-private/puppeteer';
import path from 'node:path';
import fs from 'node:fs/promises';
import { getPort } from '@sku-private/test-utils';
import {
  bundlers,
  type BundlerValues,
  cleanup,
  scopeToFixture,
  skipCleanup,
} from '@sku-private/testing-library';

const { render, joinPath } = scopeToFixture('sku-with-https');

const serverPort = 9894;

describe.sequential('sku-with-https', () => {
  describe.each(bundlers)('bundler: %s', async (bundler) => {
    const port = await getPort();
    const url = `https://localhost:${port}`;

    const portArgs = ['--strict-port', `--port=${port}`];
    const args: BundlerValues<string[]> = {
      vite: [
        '--experimental-bundler',
        '--config',
        'sku.config.vite.mjs',
        ...portArgs,
      ],
      webpack: portArgs,
    };

    describe('start', () => {
      beforeAll(async () => {
        const start = await render('start', args[bundler]);
        globalExpect(
          await start.findByText('Starting development server'),
        ).toBeInTheConsole();
      });

      afterAll(cleanup);

      it('should start a development server', async ({ expect, task }) => {
        skipCleanup(task.id);
        const snapshot = await getAppSnapshot({ url, expect });
        expect(snapshot).toMatchSnapshot();
      });

      it('should support the supplied middleware', async ({ expect, task }) => {
        skipCleanup(task.id);
        const snapshot = await getAppSnapshot({
          url: `${url}/test-middleware`,
          expect,
        });
        expect(snapshot).toMatchSnapshot();
      });
    });
  });

  describe('start-ssr', () => {
    const url = `https://localhost:${serverPort}`;

    it('should support the supplied middleware', async ({ expect }) => {
      const start = await render('start-ssr', [
        '--config=sku-server.config.ts',
      ]);
      expect(await start.findByText('Server started')).toBeInTheConsole();

      const snapshot = await getAppSnapshot({
        url: `${url}/test-middleware`,
        expect,
      });
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('serve', async () => {
    const port = await getPort();
    const url = `https://localhost:${port}`;

    beforeAll(async () => {
      const build = await render('build');
      globalExpect(
        await build.findByText('Sku build complete'),
      ).toBeInTheConsole();

      const serve = await render('serve', ['--strict-port', `--port=${port}`]);
      globalExpect(await serve.findByText('Server started')).toBeInTheConsole();
    });

    afterAll(cleanup);

    it('should start a development server', async ({ expect, task }) => {
      skipCleanup(task.id);
      const snapshot = await getAppSnapshot({ url, expect });
      expect(snapshot).toMatchSnapshot();
    });

    it('should support the supplied middleware', async ({ expect, task }) => {
      skipCleanup(task.id);
      const snapshot = await getAppSnapshot({
        url: `${url}/test-middleware`,
        expect,
      });
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('.gitignore', () => {
    it('should add the .ssl directory to .gitignore', async ({ expect }) => {
      const ignoreContents = await fs.readFile(
        path.join(joinPath('./'), '.gitignore'),
        'utf-8',
      );
      expect(ignoreContents.split('\n')).toContain(`.ssl`);
    });
  });
});
