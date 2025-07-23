import {
  describe,
  beforeAll,
  afterAll,
  it,
  expect as globalExpect,
} from 'vitest';
import path from 'node:path';
import {
  waitForUrls,
  startAssetServer,
  getStoryPage,
  getTextContentFromFrameOrPage,
} from '@sku-private/test-utils';
import { createRequire } from 'node:module';
import type { Page } from 'puppeteer';
import { scopeToFixture } from '@sku-private/testing-library';

const require = createRequire(import.meta.url);

const skuConfigFileName = 'sku.config.ts';
const appDir = path.dirname(
  require.resolve(`@sku-fixtures/storybook-config/${skuConfigFileName}`),
);
// NOTE: Puppeteer renders in a small enough window that it may trigger a breakpoint that alters the
// font size of an element

const { exec } = scopeToFixture('storybook-config');
describe('storybook-config', () => {
  describe('start', () => {
    const port = 8089;
    const storybookBaseUrl = `http://localhost:${port}`;

    const middlewareUrl = `${storybookBaseUrl}/test-middleware`;
    const storyIframePath =
      '/iframe.html?viewMode=story&id=testcomponent--default';
    const storyIframeUrl = `${storybookBaseUrl}${storyIframePath}`;

    let storyPage: Page;

    beforeAll(async () => {
      const storybook = await exec('pnpm', [
        'storybook',
        'dev',
        '--ci',
        '--port',
        port.toString(),
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

    it('should start sku dev middleware if configured', async ({ expect }) => {
      const response = await fetch(middlewareUrl);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('OK');
    });

    it('should render decorators defined in the storybook preview file', async ({
      expect,
    }) => {
      const { text, fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-decorator]',
      );

      expect(text).toEqual('Braid Text decorator');
      expect(fontSize).toEqual('16px');
    });

    it('should render a component inside a story', async ({ expect }) => {
      const { text, fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-text]',
      );

      expect(text).toEqual('Hello world');
      expect(fontSize).toEqual('16px');
    });

    it('should render vanilla styles', async ({ expect }) => {
      const { text, fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-vanilla]',
      );

      expect(text).toEqual('32px vanilla text');
      expect(fontSize).toEqual('32px');
    });
  });

  describe('start docs page', () => {
    it('should render a ".mdx" file', async ({ expect }) => {
      const port = 8088;
      const storybook = await exec('pnpm', [
        'storybook',
        'dev',
        '--ci',
        '--port',
        port.toString(),
      ]);
      globalExpect(
        await storybook.findByText(
          'Storybook 9.0.16 for react-webpack5 started',
        ),
      ).toBeInTheConsole();

      const docsIframeUrl = `http://localhost:${port}/iframe.html?viewMode=docs&id=docstest--docs`;
      const docsPage = await getStoryPage(docsIframeUrl);

      {
        const { text, fontSize } = await getTextContentFromFrameOrPage(
          docsPage,
          '#docs-test',
        );

        expect(text).toEqual('Docs Test');
        expect(fontSize).toEqual('32px');
      }

      {
        const { text, fontSize } = await getTextContentFromFrameOrPage(
          docsPage,
          '#docs-test + p',
        );

        expect(text).toEqual('I am a test document.');
        expect(fontSize).toEqual('14px');
      }

      await docsPage?.close();
    });
  });

  describe('build-storybook', () => {
    const assetServerPort = 4232;
    const assetServerUrl = `http://localhost:${assetServerPort}`;
    const storyIframePath =
      '/iframe.html?viewMode=story&id=testcomponent--default';
    const storyIframeUrl = `${assetServerUrl}${storyIframePath}`;
    const storybookDistDir = path.resolve(appDir, 'storybook-static');

    let closeStorybookServer: () => void;
    let storyPage: Page;

    beforeAll(async () => {
      const storybook = await exec('pnpm', ['storybook', 'build']);
      globalExpect(
        await storybook.findByText('info => Output directory'),
      ).toBeInTheConsole();

      closeStorybookServer = await startAssetServer(
        assetServerPort,
        storybookDistDir,
      );
      await waitForUrls(storyIframeUrl);
      storyPage = await getStoryPage(storyIframeUrl);
    }, 200000);

    afterAll(() => {
      storyPage?.close();
      closeStorybookServer();
    });

    it('should render decorators defined in the storybook preview file', async ({
      expect,
    }) => {
      const { text, fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-decorator]',
      );

      expect(text).toEqual('Braid Text decorator');
      expect(fontSize).toEqual('16px');
    });

    it('should render a component inside a story', async ({ expect }) => {
      const { text, fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-text]',
      );

      expect(text).toEqual('Hello world');
      expect(fontSize).toEqual('16px');
    });

    it('should render vanilla styles', async ({ expect }) => {
      const { text, fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-vanilla]',
      );

      expect(text).toEqual('32px vanilla text');
      expect(fontSize).toEqual('32px');
    });

    it('should render a ".mdx" file', async ({ expect }) => {
      const docsIframePath = '/iframe.html?viewMode=docs&id=docstest--docs';
      const docsIframeUrl = `${assetServerUrl}${docsIframePath}`;
      const docsPage = await getStoryPage(docsIframeUrl);
      await waitForUrls(docsIframeUrl);

      {
        const { text, fontSize } = await getTextContentFromFrameOrPage(
          docsPage,
          '#docs-test',
        );

        expect(text).toEqual('Docs Test');
        expect(fontSize).toEqual('32px');
      }

      {
        const { text, fontSize } = await getTextContentFromFrameOrPage(
          docsPage,
          '#docs-test + p',
        );

        await docsPage.close();

        expect(text).toEqual('I am a test document.');
        expect(fontSize).toEqual('14px');
      }
    });
  });
});
