import {
  describe,
  beforeAll,
  afterAll,
  it,
  expect as globalExpect,
} from 'vitest';
import {
  getStoryPage,
  getTextContentFromFrameOrPage,
} from '@sku-private/test-utils';

import type { Page } from 'puppeteer';
import { scopeToFixture, waitFor } from '@sku-private/testing-library';

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

    let storyPage: Page;

    beforeAll(async () => {
      const storybook = await exec('pnpm', ['storybook', 'build']);

      await waitFor(async () => {
        globalExpect(storybook.hasExit()).toMatchObject({
          exitCode: 0,
        });
      });

      const assetServer = await exec('npm', ['run', 'start:asset-server']);
      globalExpect(
        await assetServer.findByText('serving storybook-static'),
      ).toBeInTheConsole();

      storyPage = await getStoryPage(storyIframeUrl);
    });

    afterAll(() => {
      storyPage?.close();
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

      const assetServer = await exec('npm', ['run', 'start:asset-server']);
      globalExpect(
        await assetServer.findByText('serving storybook-static'),
      ).toBeInTheConsole();

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

      await docsPage.close();
    });
  });
});
