/* eslint-disable jest/expect-expect */
const path = require('path');
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const startAssetServer = require('../../utils/assetServer');
const { getAppSnapshot } = require('../../utils/appSnapshot');
const waitForUrls = require('../../utils/waitForUrls');
const appDir = path.resolve(__dirname, 'app');
const skuStartConfig = require('./app/sku.config');

const getTestConfig = (skuConfig) => ({
  backendUrl: `http://localhost:${skuConfig.serverPort}`,
  targetDirectory: path.join(__dirname, skuConfig.target),
});

describe('ssr translations', () => {
  let server;
  const { backendUrl } = getTestConfig(skuStartConfig);

  beforeAll(async () => {
    server = await runSkuScriptInDir('start-ssr', appDir);
    await waitForUrls(backendUrl);
  });

  afterAll(async () => {
    await server.kill();
  });
  it('should render en', async () => {
    const app = await getAppSnapshot(`${backendUrl}/en`);
    expect(app).toMatchSnapshot();
  });

  it('should render fr', async () => {
    const app = await getAppSnapshot(`${backendUrl}/fr`);
    expect(app).toMatchSnapshot();
  });
});
