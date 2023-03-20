const path = require('path');
const dirContentsToObject = require('../test/utils/dirContentsToObject');
const runSkuScriptInDir = require('../test/utils/runSkuScriptInDir');
const waitForUrls = require('../test/utils/waitForUrls');
const startAssetServer = require('../test/utils/assetServer');
const { getAppSnapshot } = require('../test/utils/appSnapshot');
const { getStorybookContent } = require('../test/utils/getStorybookContent');
const appDir = path.dirname(
  require.resolve('@fixtures/react-css-modules/sku.config.js'),
);
const distDir = path.resolve(appDir, 'dist');
const storybookDistDir = path.resolve(appDir, 'dist-storybook');

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
    const storybookUrl = 'http://localhost:8048';
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('storybook', appDir, ['--ci']);
      await waitForUrls(storybookUrl);
    }, 200000);

    afterAll(async () => {
      await server.kill();
    });

    it('should start a storybook server', async () => {
      const { text, fontSize } = await getStorybookContent(
        storybookUrl,
        '[data-automation-text]',
      );
      expect(text).toEqual('Storybook render');
      expect(fontSize).toEqual('32px');
    });
  });

  describe('build-storybook', () => {
    let closeStorybookServer;
    const asserServerPort = 4297;
    const assetServerUrl = `http://localhost:${asserServerPort}`;

    beforeAll(async () => {
      await runSkuScriptInDir('build-storybook', appDir);
      closeStorybookServer = await startAssetServer(
        asserServerPort,
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

      expect(text).toEqual('Storybook render');
      expect(fontSize).toEqual('32px');
    });
  });
});
