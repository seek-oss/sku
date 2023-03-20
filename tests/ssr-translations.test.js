const path = require('path');
const {
  runSkuScriptInDir,
  waitForUrls,
  getAppSnapshot,
} = require('@sku-private/test-utils');

const skuSsrConfig = require('@sku-fixtures/translations/sku-ssr.config.js');
const appDir = path.dirname(
  require.resolve('@sku-fixtures/translations/sku-ssr.config.js'),
);

const getTestConfig = (skuConfig) => ({
  backendUrl: `http://localhost:${skuConfig.serverPort}`,
  targetDirectory: path.join(__dirname, skuConfig.target),
});

describe('ssr translations', () => {
  let server;
  const { backendUrl } = getTestConfig(skuSsrConfig);

  beforeAll(async () => {
    server = await runSkuScriptInDir('start-ssr', appDir, [
      '--config=sku-ssr.config.js',
    ]);
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

  it('should render en-PSEUDO', async () => {
    const app = await getAppSnapshot(`${backendUrl}/en?pseudo=true`);
    expect(app).toMatchSnapshot();
  });
});
