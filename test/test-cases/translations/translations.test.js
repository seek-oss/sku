/* eslint-disable jest/expect-expect */
const path = require('path');
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const { getAppSnapshot } = require('../../utils/appSnapshot');
const waitForUrls = require('../../utils/waitForUrls');
const appDir = path.resolve(__dirname, 'app');
const { port } = require('./app/sku.config');

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
});
