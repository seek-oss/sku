const path = require('path');
const {
  dirContentsToObject,
  runSkuScriptInDir,
} = require('@sku-private/test-utils');

const appDir = path.dirname(
  require.resolve('@sku-fixtures/seek-style-guide/sku.config.js'),
);
const distDir = path.resolve(appDir, 'dist');

describe('seek-style-guide', () => {
  beforeAll(async () => {
    await runSkuScriptInDir('build', appDir);
  });

  it('should generate the expected files', async () => {
    const files = await dirContentsToObject(distDir);
    expect(files).toMatchSnapshot();
  });

  it('should handle seek-style-guide in tests', async () => {
    const { childProcess } = await runSkuScriptInDir('test', appDir);
    expect(childProcess.exitCode).toEqual(0);
  });
});
