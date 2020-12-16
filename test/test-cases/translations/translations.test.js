/* eslint-disable jest/expect-expect */
const path = require('path');
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const startAssetServer = require('../../utils/assetServer');
const { getAppSnapshot } = require('../../utils/appSnapshot');
const appDir = path.resolve(__dirname, 'app');
const distDir = path.resolve(appDir, 'dist');

describe('translations', () => {
  let closeAssetServer;

  beforeAll(async () => {
    await runSkuScriptInDir('translations compile', appDir);
    await runSkuScriptInDir('build', appDir);
    closeAssetServer = await startAssetServer(4758, distDir);
  });

  afterAll(() => {
    closeAssetServer();
  });

  it('should render en', async () => {
    const app = await getAppSnapshot('http://localhost:4758/en');
    expect(app).toMatchSnapshot();
  });

  it('should render fr', async () => {
    const app = await getAppSnapshot('http://localhost:4758/fr');
    expect(app).toMatchSnapshot();
  });
});
