const path = require('path');
const {
  runSkuScriptInDir,
  waitForUrls,
  startAssetServer,
  getStorybookFrame,
  getTextContentFromStorybookFrame,
} = require('@sku-private/test-utils');
const fetch = require('node-fetch');

const skuConfigFileName = 'sku.storybook.config.ts';
const appDir = path.dirname(
  require.resolve(`@sku-fixtures/storybook-config/${skuConfigFileName}`),
);
const storybookDistDir = path.resolve(appDir, 'dist-storybook');

// NOTE: Puppeteer renders in a small enough window that it may trigger a breakpoint that alters the
// font size of an element
describe('storybook-config', () => {
  describe('storybook', () => {
    const storybookUrl = 'http://localhost:8089';
    const middlewareUrl = `${storybookUrl}/test-middleware`;

    let server;
    /** @type {import("puppeteer").Frame} */
    let storybookFrame;

    beforeAll(async () => {
      server = await runSkuScriptInDir('storybook', appDir, [
        '--ci',
        '--config',
        skuConfigFileName,
      ]);
      await waitForUrls(storybookUrl, middlewareUrl);
      storybookFrame = await getStorybookFrame(storybookUrl);
    }, 200000);

    afterAll(async () => {
      await server.kill();
    });

    it('should start sku dev middleware if configured', async () => {
      const response = await fetch(middlewareUrl);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('OK');
    });

    it('should render decorators defined in the storybook preview file', async () => {
      const { text, fontSize } = await getTextContentFromStorybookFrame(
        storybookFrame,
        '[data-automation-decorator]',
      );

      expect(text).toEqual('Braid Text decorator');
      expect(fontSize).toEqual('16px');
    });

    it('should render a component inside a story', async () => {
      const { text, fontSize } = await getTextContentFromStorybookFrame(
        storybookFrame,
        '[data-automation-text]',
      );

      expect(text).toEqual('Hello world');
      expect(fontSize).toEqual('16px');
    });

    it('should render vanilla styles', async () => {
      const { text, fontSize } = await getTextContentFromStorybookFrame(
        storybookFrame,
        '[data-automation-vanilla]',
      );

      expect(text).toEqual('32px vanilla text');
      expect(fontSize).toEqual('32px');
    });

    it('should render less styles', async () => {
      const { text, fontSize } = await getTextContentFromStorybookFrame(
        storybookFrame,
        '[data-automation-less]',
      );

      expect(text).toEqual('32px less text');
      expect(fontSize).toEqual('32px');
    });
  });

  describe('build-storybook', () => {
    const assetServerPort = 4232;
    const assetServerUrl = `http://localhost:${assetServerPort}`;

    let closeStorybookServer;
    /** @type {import("puppeteer").Frame} */
    let storybookFrame;

    beforeAll(async () => {
      await runSkuScriptInDir('build-storybook', appDir, [
        '--config',
        skuConfigFileName,
      ]);
      closeStorybookServer = await startAssetServer(
        assetServerPort,
        storybookDistDir,
      );
      await waitForUrls(assetServerUrl);
      storybookFrame = await getStorybookFrame(assetServerUrl);
    }, 200000);

    afterAll(() => {
      closeStorybookServer();
    });

    it('should render decorators defined in the storybook preview file', async () => {
      const { text, fontSize } = await getTextContentFromStorybookFrame(
        storybookFrame,
        '[data-automation-decorator]',
      );

      expect(text).toEqual('Braid Text decorator');
      expect(fontSize).toEqual('16px');
    });

    it('should render a component inside a story', async () => {
      const { text, fontSize } = await getTextContentFromStorybookFrame(
        storybookFrame,
        '[data-automation-text]',
      );

      expect(text).toEqual('Hello world');
      expect(fontSize).toEqual('16px');
    });

    it('should render vanilla styles', async () => {
      const { text, fontSize } = await getTextContentFromStorybookFrame(
        storybookFrame,
        '[data-automation-vanilla]',
      );

      expect(text).toEqual('32px vanilla text');
      expect(fontSize).toEqual('32px');
    });

    it('should render less styles', async () => {
      const { text, fontSize } = await getTextContentFromStorybookFrame(
        storybookFrame,
        '[data-automation-less]',
      );

      expect(text).toEqual('32px less text');
      expect(fontSize).toEqual('32px');
    });
  });
});
