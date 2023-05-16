const path = require('path');
const {
  dirContentsToObject,
  runSkuScriptInDir,
  startAssetServer,
  getAppSnapshot,
} = require('@sku-private/test-utils');

const appDir = path.dirname(
  require.resolve('@sku-fixtures/react-css-modules/sku.config.js'),
);
const distDir = path.resolve(appDir, 'dist');

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
});
