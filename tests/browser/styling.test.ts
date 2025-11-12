import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { getAppSnapshot, getTextContent } from '@sku-private/playwright';
import { dirContentsToObject } from '@sku-private/test-utils';
import {
  cleanup,
  scopeToFixture,
  skipCleanup,
} from '@sku-private/testing-library';

const port = 8205;
const devServerUrl = `http://localhost:${port}`;

const { sku, exec, fixturePath } = scopeToFixture('styling');
const distDir = fixturePath('dist');

const storybookStartedRegex =
  /Storybook \d+\.\d+\.\d+ for react-webpack5 started/;

describe('styling', () => {
  describe('build', () => {
    beforeAll(async () => {
      const build = await sku('build');
      expect(await build.findByText('Sku build complete')).toBeInTheConsole();
    });

    it('should create valid app', async () => {
      const serve = await sku('serve');
      expect(await serve.findByText('Server started')).toBeInTheConsole();

      const app = await getAppSnapshot({ url: devServerUrl });
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(distDir);
      expect(files).toMatchSnapshot();
    });
  });

  describe('start', () => {
    it('should start a development server', async () => {
      const start = await sku('start');
      expect(
        await start.findByText('Starting development server'),
      ).toBeInTheConsole();

      const snapshot = await getAppSnapshot({ url: devServerUrl });
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('test', () => {
    it('should handle Vanilla Extract styles in tests', async () => {
      const test = await sku('test');
      expect(await test.findByError('1 passed, 1 total')).toBeInTheConsole();
    });
  });

  describe('storybook', () => {
    const storybookPort = 8090;
    const storybookBaseUrl = `http://localhost:${storybookPort}`;

    const storyIframePath = '/iframe.html?viewMode=story&id=blueblock--default';
    const storyIframeUrl = `${storybookBaseUrl}${storyIframePath}`;

    beforeAll(async () => {
      const storybook = await exec('pnpm', [
        'storybook',
        'dev',
        '--ci',
        '--exact-port',
        '--port',
        storybookPort.toString(),
      ]);
      expect(
        await storybook.findByText(storybookStartedRegex),
      ).toBeInTheConsole();
    });

    afterAll(async () => {
      await cleanup();
    });

    it('should render external styles', async ({ task }) => {
      skipCleanup(task.id);
      const { text, fontSize } = await getTextContent(
        storyIframeUrl,
        '[data-automation-external]',
      );

      expect(text).toEqual('This should be invisible');
      expect(fontSize).toEqual('9px');
    });

    it('should render Vanilla Extract styles', async ({ task }) => {
      skipCleanup(task.id);
      const { fontSize } = await getTextContent(
        storyIframeUrl,
        '[data-automation-vanilla]',
      );

      expect(fontSize).toEqual('64px');
    });
  });
});
