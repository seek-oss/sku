const path = require('path');
const dirContentsToObject = require('../test/utils/dirContentsToObject');
const runSkuScriptInDir = require('../test/utils/runSkuScriptInDir');
const waitForUrls = require('../test/utils/waitForUrls');
const startAssetServer = require('../test/utils/assetServer');
const { getAppSnapshot } = require('../test/utils/appSnapshot');
const appDir = path.dirname(
  require.resolve('@fixtures/react-css-modules/sku.config.js'),
);
const distDir = path.resolve(appDir, 'dist');
const storybookDistDir = path.resolve(appDir, 'dist-storybook');

const getStorybookContent = async (url) => {
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

  const element = await storybookFrame.waitForSelector(
    '[data-automation-text]',
  );

  return element.evaluate((e) => ({
    text: e.innerText,
    fontSize: window.getComputedStyle(e).getPropertyValue('font-size'),
  }));
};

jest.setTimeout(200000);

describe('react-css-modules', () => {
  let closeAssetServer;

  beforeAll(async () => {
    await runSkuScriptInDir('build', appDir);
    closeAssetServer = await startAssetServer(4293, distDir);
  });

  afterAll(() => {
    closeAssetServer();
  });

  it('should create valid app', async () => {
    const app = await getAppSnapshot('http://localhost:4293');
    expect(app).toMatchSnapshot();
  });

  it('should generate the expected files', async () => {
    const files = await dirContentsToObject(distDir);
    expect(files).toMatchSnapshot();
  });

  it('should handle Less and css.js in tests', async () => {
    const { childProcess } = await runSkuScriptInDir('test', appDir);
    expect(childProcess.exitCode).toEqual(0);
  });

  describe('storybook', () => {
    const storybookUrl = 'http://localhost:8084';
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('storybook', appDir, ['--ci']);
      await waitForUrls(storybookUrl);
    });

    afterAll(async () => {
      await server.kill();
    });

    it('should start a storybook server', async () => {
      const { text, fontSize } = await getStorybookContent(storybookUrl);
      expect(text).toEqual('Storybook render');
      expect(fontSize).toEqual('32px');
    });
  });

  describe('build-storybook', () => {
    let closeStorybookServer;

    beforeAll(async () => {
      await runSkuScriptInDir('build-storybook', appDir);
      closeStorybookServer = await startAssetServer(4297, storybookDistDir);
    });

    afterAll(() => {
      closeStorybookServer();
    });

    it('should create valid storybook', async () => {
      const { text, fontSize } = await getStorybookContent(
        'http://localhost:4297',
      );

      expect(text).toEqual('Storybook render');
      expect(fontSize).toEqual('32px');
    });
  });
});
