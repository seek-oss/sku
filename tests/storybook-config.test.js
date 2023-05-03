const path = require('path');
const {
  runSkuScriptInDir,
  waitForUrls,
  startAssetServer,
  getStorybookContent,
} = require('@sku-private/test-utils');
const fetch = require('node-fetch');

const appDir = path.dirname(
  require.resolve('@sku-fixtures/storybook-config/sku.config.ts'),
);
const storybookDistDir = path.resolve(appDir, 'dist-storybook');

describe('storybook-config', () => {
  describe('storybook', () => {
    const storybookUrl = 'http://localhost:8089';
    const middlewareUrl = `${storybookUrl}/test-middleware`;
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('storybook', appDir, ['--ci']);
      await waitForUrls(storybookUrl, middlewareUrl);
    }, 200000);

    afterAll(async () => {
      await server.kill();
    });

    it('should start a storybook server', async () => {
      const { text, fontSize } = await getStorybookContent(
        storybookUrl,
        '[data-automation-text]',
      );
      expect(text).toEqual('Hello world');
      expect(fontSize).toEqual('16px');
    });

    it('should start sku dev middleware if configured', async () => {
      const response = await fetch(middlewareUrl);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('OK');
    });
  });

  describe('build-storybook', () => {
    let closeStorybookServer;
    const assetServerPort = 4232;
    const assetServerUrl = `http://localhost:${assetServerPort}`;

    beforeAll(async () => {
      await runSkuScriptInDir('build-storybook', appDir);
      closeStorybookServer = await startAssetServer(
        assetServerPort,
        storybookDistDir,
      );
      await waitForUrls(assetServerUrl);
    }, 200000);

    afterAll(() => {
      closeStorybookServer();
    });

    it('should create valid storybook', async () => {
      const { text, fontSize } = await getStorybookContent(
        assetServerUrl,
        '[data-automation-text]',
      );

      expect(text).toEqual('Hello world');
      expect(fontSize).toEqual('16px');
    });
  });
});
