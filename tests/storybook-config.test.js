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

const getStorybookElement = async (url, elementSelector) => {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const firstStoryButton = await page.waitForSelector(
    '#storybook-explorer-menu button',
  );

  // Ensure default story is activated
  firstStoryButton.click();

  const iframeElement = await page.waitForSelector('#storybook-preview-iframe');

  const storybookFrame = await iframeElement.contentFrame();

  if (!storybookFrame) {
    console.log('Unable to find storybookFrame', storybookFrame);
    throw new Error('Unable to find iframe by id');
  }

  return await storybookFrame.waitForSelector(elementSelector);
};

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

    it('should start sku dev middleware if configured', async () => {
      const response = await fetch(middlewareUrl);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('OK');
    });

    it('should render a component inside a story', async () => {
      const { text, fontSize } = await getStorybookContent(
        storybookUrl,
        '[data-automation-text]',
      );
      expect(text).toEqual('Hello world');
      expect(fontSize).toEqual('16px');
    });

    it('should render vanilla styles', async () => {
      const { text, fontSize } = await getStorybookContent(
        storybookUrl,
        '[data-automation-vanilla]',
      );
      expect(text).toEqual('32px vanilla text');
      expect(fontSize).toEqual('32px');
    });

    it('should render less styles', async () => {
      const { text, fontSize } = await getStorybookContent(
        storybookUrl,
        '[data-automation-less]',
      );
      expect(text).toEqual('32px less text');
      expect(fontSize).toEqual('32px');
    });

    it('should render seek style guide text', async () => {
      const { text, fontSize } = await getStorybookContent(
        storybookUrl,
        '[data-automation-seek-style-guide]',
      );
      expect(text).toEqual('Style guide text');
      expect(fontSize).toEqual('18px');
    });

    it('should render a seek style guide icon', async () => {
      const svg = await getStorybookElement(
        storybookUrl,
        '[data-automation-svg] svg',
      );
      expect(svg).not.toBe(null);
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

    it('should render a component inside a story', async () => {
      const { text, fontSize } = await getStorybookContent(
        assetServerUrl,
        '[data-automation-text]',
      );
      expect(text).toEqual('Hello world');
      expect(fontSize).toEqual('16px');
    });

    it('should render vanilla styles', async () => {
      const { text, fontSize } = await getStorybookContent(
        assetServerUrl,
        '[data-automation-vanilla]',
      );
      expect(text).toEqual('32px vanilla text');
      expect(fontSize).toEqual('32px');
    });

    it('should render less styles', async () => {
      const { text, fontSize } = await getStorybookContent(
        assetServerUrl,
        '[data-automation-less]',
      );
      expect(text).toEqual('32px less text');
      expect(fontSize).toEqual('32px');
    });

    it('should render seek style guide text', async () => {
      const { text, fontSize } = await getStorybookContent(
        assetServerUrl,
        '[data-automation-seek-style-guide]',
      );
      expect(text).toEqual('Style guide text');
      expect(fontSize).toEqual('18px');
    });

    it('should render a seek style guide icon', async () => {
      const svg = await getStorybookElement(
        assetServerUrl,
        '[data-automation-svg] svg',
      );
      expect(svg).not.toBe(null);
    });
  });
});
