const path = require('path');
const {
  runSkuScriptInDir,
  waitForUrls,
  getAppSnapshot,
} = require('@sku-private/test-utils');

const appDir = path.dirname(
  require.resolve('@sku-fixtures/translations/sku.config.js'),
);
const { port } = require('@sku-fixtures/translations/sku.config.js');

const baseUrl = `http://localhost:${port}`;

describe('translations', () => {
  let process;

  beforeAll(async () => {
    await runSkuScriptInDir('build', appDir);
    process = await runSkuScriptInDir('serve', appDir);
    await waitForUrls(`${baseUrl}/en`);
  });

  afterAll(() => {
    process.kill();
  });

  it('should render en', async () => {
    const app = await getAppSnapshot(`${baseUrl}/en`);
    expect(app).toMatchSnapshot();
  });

  it('should render fr', async () => {
    const app = await getAppSnapshot(`${baseUrl}/fr`);
    expect(app).toMatchSnapshot();
  });

  it('should render en-PSEUDO post-hydration', async () => {
    const app = await getAppSnapshot(`${baseUrl}/en?pseudo=true`);
    expect(app).toMatchSnapshot();
  });

  it('should support query parameters', async () => {
    const app = await getAppSnapshot(`${baseUrl}/en?a=1`);
    expect(app).toMatchSnapshot();
  });
});
