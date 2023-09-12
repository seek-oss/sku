import assert from 'node:assert/strict';
import path from 'path';
import {
  runSkuScriptInDir,
  waitForUrls,
  getAppSnapshot,
} from '@sku-private/test-utils';

import skuSsrConfig from '@sku-fixtures/translations/sku-ssr.config.ts';
const appDir = path.dirname(
  require.resolve('@sku-fixtures/translations/sku-ssr.config.ts'),
);

assert(skuSsrConfig.serverPort, 'sku config has serverPort');
const getTestConfig = (skuConfig) => ({
  backendUrl: `http://localhost:${skuConfig.serverPort}`,
  targetDirectory: path.join(__dirname, skuConfig.target),
});

describe('ssr translations', () => {
  let server;
  const { backendUrl } = getTestConfig(skuSsrConfig);

  beforeAll(async () => {
    server = await runSkuScriptInDir('start-ssr', appDir, [
      '--config=sku-ssr.config.ts',
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
