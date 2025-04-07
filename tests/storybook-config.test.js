import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import path from 'node:path';
import { sync as spawnSync } from 'cross-spawn';
import {
  waitForUrls,
  startAssetServer,
  getStoryPage,
  getTextContentFromFrameOrPage,
  gracefulSpawn,
} from '@sku-private/test-utils';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const skuConfigFileName = 'sku.config.ts';
const appDir = path.dirname(
  require.resolve(`@sku-fixtures/storybook-config/${skuConfigFileName}`),
);
// NOTE: Puppeteer renders in a small enough window that it may trigger a breakpoint that alters the
// font size of an element
describe('storybook-config', () => {
  describe('storybook', () => {
    const port = 8089;
    const storybookBaseUrl = `http://localhost:${port}`;

    const middlewareUrl = `${storybookBaseUrl}/test-middleware`;
    const storyIframePath =
      '/iframe.html?viewMode=story&id=testcomponent--default';
    const storyIframeUrl = `${storybookBaseUrl}${storyIframePath}`;

    /** @type {ChildProcess} */
    let server;
    /** @type {import("puppeteer").Page} */
    let storyPage;

    beforeAll(async () => {
      server = gracefulSpawn(
        'pnpm',
        ['storybook', 'dev', '--ci', '--quiet', '--port', port.toString()],
        {
          cwd: appDir,
          stdio: 'inherit',
        },
      );
      await waitForUrls(storyIframeUrl, middlewareUrl);
      storyPage = await getStoryPage(storyIframeUrl);
    }, 100000);

    afterAll(async () => {
      await server.kill();
    });

    it('should start sku dev middleware if configured', async () => {
      const response = await fetch(middlewareUrl);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('OK');
    });

    it('should render decorators defined in the storybook preview file', async () => {
      const { text, fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-decorator]',
      );

      expect(text).toEqual('Braid Text decorator');
      expect(fontSize).toEqual('16px');
    });

    it('should render a component inside a story', async () => {
      const { text, fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-text]',
      );

      expect(text).toEqual('Hello world');
      expect(fontSize).toEqual('16px');
    });

    it('should render vanilla styles', async () => {
      const { text, fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-vanilla]',
      );

      expect(text).toEqual('32px vanilla text');
      expect(fontSize).toEqual('32px');
    });

    it('should render a ".mdx" file', async () => {
      const docsIframePath = '/iframe.html?viewMode=docs&id=docstest--docs';
      const docsIframeUrl = `${storybookBaseUrl}${docsIframePath}`;
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

        expect(text).toEqual('I am a test document.');
        expect(fontSize).toEqual('14px');
      }
    });
  });

  describe('build-storybook', () => {
    const assetServerPort = 4232;
    const assetServerUrl = `http://localhost:${assetServerPort}`;
    const storyIframePath =
      '/iframe.html?viewMode=story&id=testcomponent--default';
    const storyIframeUrl = `${assetServerUrl}${storyIframePath}`;
    const storybookDistDir = path.resolve(appDir, 'storybook-static');

    let closeStorybookServer;
    /** @type {import("puppeteer").Page} */
    let storyPage;

    beforeAll(async () => {
      spawnSync('pnpm', ['storybook', 'build', '--quiet'], {
        cwd: appDir,
        stdio: 'inherit',
      });

      closeStorybookServer = await startAssetServer(
        assetServerPort,
        storybookDistDir,
      );
      await waitForUrls(storyIframeUrl);
      storyPage = await getStoryPage(storyIframeUrl);
    }, 200000);

    afterAll(() => {
      closeStorybookServer();
    });

    it('should render decorators defined in the storybook preview file', async () => {
      const { text, fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-decorator]',
      );

      expect(text).toEqual('Braid Text decorator');
      expect(fontSize).toEqual('16px');
    });

    it('should render a component inside a story', async () => {
      const { text, fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-text]',
      );

      expect(text).toEqual('Hello world');
      expect(fontSize).toEqual('16px');
    });

    it('should render vanilla styles', async () => {
      const { text, fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-vanilla]',
      );

      expect(text).toEqual('32px vanilla text');
      expect(fontSize).toEqual('32px');
    });

    it('should render a ".mdx" file', async () => {
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

        expect(text).toEqual('I am a test document.');
        expect(fontSize).toEqual('14px');
      }
    });
  });
});
