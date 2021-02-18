const path = require('path');
const fs = require('fs-extra');
const rmfr = require('rmfr');
const dirContentsToObject = require('../../utils/dirContentsToObject');
const waitForUrls = require('../../utils/waitForUrls');
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const { getAppSnapshot } = require('../../utils/appSnapshot');
const { getPathFromCwd } = require('../../../lib/cwd');
const appDir = path.resolve(__dirname, 'app');
const distDir = path.resolve(appDir, 'dist');

async function createPackageCopy(name) {
  const srcPath = getPathFromCwd(
    /^sku\//.test(name)
      ? `${name.replace('sku/', '')}`
      : `node_modules/${name}`,
  );
  const destPath = `${__dirname}/app/node_modules/${name}`;

  await fs.mkdirp(destPath);
  await fs.copy(srcPath, destPath);
}

async function setUpLocalDependencies() {
  const nodeModules = `${__dirname}/app/node_modules`;
  await rmfr(nodeModules);
  await createPackageCopy('sku/treat');
}

describe('library-build', () => {
  describe('build', () => {
    beforeAll(async () => {
      await setUpLocalDependencies();
      await runSkuScriptInDir('build', appDir);
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(distDir);
      expect(files).toMatchSnapshot();
    });
  });

  describe('start', () => {
    const devServerUrl = `http://localhost:8082`;
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('start', appDir);
      await waitForUrls(devServerUrl);
    });

    afterAll(async () => {
      await server.kill();
    });

    it('should start a development server', async () => {
      const snapshot = await getAppSnapshot(devServerUrl);
      expect(snapshot).toMatchSnapshot();
    });
  });
});
