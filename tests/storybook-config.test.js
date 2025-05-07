import { describe, beforeAll, afterAll, afterEach, it } from 'vitest';
import path from 'node:path';
import { sync as spawnSync } from 'cross-spawn';
import {
  waitForUrls,
  startAssetServer,
  getStoryPage,
  getTextContentFromFrameOrPage,
  run,
  createCancelSignal,
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

    const { cancel, signal } = createCancelSignal();
    /** @type {import("puppeteer").Page} */
    let storyPage;

    beforeAll(async () => {
      run('pnpm', {
        args: [
          'storybook',
          'dev',
          '--ci',
          '--quiet',
          '--port',
          port.toString(),
        ],
        cwd: appDir,
        stdio: 'inherit',
        signal,
      });
      await waitForUrls(storyIframeUrl, middlewareUrl);
      storyPage = await getStoryPage(storyIframeUrl);
    }, 100000);

    afterAll(async () => {
      await storyPage?.close();
      cancel();
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

    describe('Docs Page', () => {
      let docsPage;
      afterEach(async () => {
        await docsPage?.close();
      });
      it('should render a ".mdx" file', async ({ expect }) => {
        const docsIframePath = '/iframe.html?viewMode=docs&id=docstest--docs';
        const docsIframeUrl = `${storybookBaseUrl}${docsIframePath}`;
        docsPage = await getStoryPage(docsIframeUrl);
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
