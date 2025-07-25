import {
  describe,
  beforeAll,
  afterAll,
  it,
  expect as globalExpect,
} from 'vitest';
import { getAppSnapshot } from '@sku-private/puppeteer';
import type { Page } from 'puppeteer';
import {
  dirContentsToObject,
  getStoryPage,
  getTextContentFromFrameOrPage,
} from '@sku-private/test-utils';
import { scopeToFixture } from '@sku-private/testing-library';

const port = 8205;
const devServerUrl = `http://localhost:${port}`;

const { sku, exec, fixturePath } = scopeToFixture('styling');
const distDir = fixturePath('dist');

describe('styling', () => {
  describe('build', () => {
    beforeAll(async () => {
      const build = await sku('build');
      globalExpect(
        await build.findByText('Sku build complete'),
      ).toBeInTheConsole();
    });

    it('should create valid app', async ({ expect }) => {
      const serve = await sku('serve');
      globalExpect(await serve.findByText('Server started')).toBeInTheConsole();

      const app = await getAppSnapshot({ url: devServerUrl, expect });
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async ({ expect }) => {
      const files = await dirContentsToObject(distDir);
      expect(files).toMatchSnapshot();
    });
  });

  describe('start', () => {
    it('should start a development server', async ({ expect }) => {
      const start = await sku('start');
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

  describe('storybook', () => {
    const storybookPort = 8090;
    const storybookBaseUrl = `http://localhost:${storybookPort}`;

    const storyIframePath = '/iframe.html?viewMode=story&id=blueblock--default';
    const storyIframeUrl = `${storybookBaseUrl}${storyIframePath}`;

    let storyPage: Page;

    beforeAll(async () => {
      const storybook = await exec('pnpm', [
        'storybook',
        'dev',
        '--ci',
        '--port',
        storybookPort.toString(),
      ]);
      globalExpect(
        await storybook.findByText(
          'Storybook 9.0.16 for react-webpack5 started',
        ),
      ).toBeInTheConsole();

      storyPage = await getStoryPage(storyIframeUrl);
    });

    afterAll(async () => {
      await storyPage?.close();
    });

    it('should render external styles', async ({ expect }) => {
      const { text, fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-external]',
      );

      expect(text).toEqual('This should be invisible');
      expect(fontSize).toEqual('9px');
    });

    it('should render Vanilla Extract styles', async ({ expect }) => {
      const { fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-vanilla]',
      );

      expect(fontSize).toEqual('64px');
    });
  });
});
