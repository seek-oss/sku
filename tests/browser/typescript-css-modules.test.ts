import {
  describe,
  beforeAll,
  afterAll,
  it,
  expect as globalExpect,
} from 'vitest';
import { getAppSnapshot } from '@sku-private/puppeteer';
import { rm } from 'node:fs/promises';
import { dirContentsToObject, getPort } from '@sku-private/test-utils';
import { scopeToFixture, waitFor } from '@sku-private/testing-library';

const { sku, fixturePath, node, exec } = scopeToFixture(
  'typescript-css-modules',
);

const distDir = fixturePath('dist');
const distSsrDir = fixturePath('dist-ssr');

describe.sequential('typescript-css-modules', () => {
  describe('build', async () => {
    const port = await getPort();
    const url = `http://localhost:${port}`;

    beforeAll(async () => {
      const build = await sku('build');
      globalExpect(
        await build.findByText('Sku build complete'),
      ).toBeInTheConsole();
    });

    afterAll(async () => {
      // Clean up dist dir to prevent pollution of linted files in lint test
      await rm(distDir, { recursive: true, force: true });
    });

    it('should create valid app', async ({ expect }) => {
      const serve = await sku('serve', ['--strict-port', `--port=${port}`]);
      globalExpect(await serve.findByText('Server started')).toBeInTheConsole();

      const app = await getAppSnapshot({ url, expect });
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async ({ expect }) => {
      const files = await dirContentsToObject(distDir);
      expect(files).toMatchSnapshot();
    });
  });

  describe('build-ssr', async () => {
    const backendUrl = `http://localhost:8010`;

    beforeAll(async () => {
      const buildSsr = await sku('build-ssr', ['--config=sku-ssr.config.ts']);
      globalExpect(
        await buildSsr.findByText('Sku build complete'),
      ).toBeInTheConsole();
    });

    afterAll(async () => {
      // Clean up dist dir to prevent pollution of linted files in lint test
      await rm(distSsrDir, { recursive: true, force: true });
    });

    it('should create valid app', async ({ expect }) => {
      await node(['dist-ssr/server.cjs']);
      const assetServer = await exec('pnpm', ['run', 'start:asset-server']);
      expect(
        await assetServer.findByText('serving dist-ssr'),
      ).toBeInTheConsole();

      const app = await getAppSnapshot({ url: backendUrl, expect });
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async ({ expect }) => {
      const files = await dirContentsToObject(distSsrDir, [
        '.cjs',
        '.js',
        '.css',
      ]);
      expect(files).toMatchSnapshot();
    });
  });

  describe('start', async () => {
    it('should start a development server', async ({ expect }) => {
      const port = await getPort();
      const devServerUrl = `http://localhost:${port}`;

      const start = await sku('start', ['--strict-port', `--port=${port}`]);
      globalExpect(
        await start.findByText('Starting development server'),
      ).toBeInTheConsole();

      const snapshot = await getAppSnapshot({ url: devServerUrl, expect });
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('test', () => {
    it('should handle Vanilla Extract styles in tests', async ({ expect }) => {
      const test = await sku('test');
      expect(await test.findByError('1 passed, 1 total')).toBeInTheConsole();
    });
  });

  describe('lint', () => {
    it('should handle tsc and eslint', async ({ expect }) => {
      // run build first to ensure typescript declarations are generated
      const build = await sku('build');
      globalExpect(
        await build.findByText('Sku build complete'),
      ).toBeInTheConsole();

      const lint = await sku('lint');
      expect(await lint.findByText('Linting complete')).toBeInTheConsole();
      await waitFor(() => {
        expect(lint.hasExit()).toMatchObject({
          exitCode: 0,
        });
      });
    });
  });
});
