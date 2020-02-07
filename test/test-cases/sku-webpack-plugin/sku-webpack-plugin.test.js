const path = require('path');
const { promisify } = require('util');
const spawn = require('../../../lib/gracefulSpawn');
const rimrafAsync = promisify(require('rimraf'));
const fs = require('fs-extra');
const dirContentsToObject = require('../../utils/dirContentsToObject');
const { getAppSnapshot } = require('../../utils/appSnapshot');
const waitForUrls = require('../../utils/waitForUrls');
const startAssetServer = require('../../utils/assetServer');
const { getPathFromCwd } = require('../../../lib/cwd');
const { runBin } = require('../../../lib/runBin');

const appDir = path.resolve(__dirname, 'app');
const distDir = path.resolve(appDir, 'dist');

async function createPackageLink(name) {
  await fs.mkdirp(`${__dirname}/app/node_modules`);
  await fs.symlink(
    getPathFromCwd(`node_modules/${name}`),
    `${__dirname}/app/node_modules/${name}`,
  );
}

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
  await rimrafAsync(nodeModules);
  await Promise.all(['react', 'react-dom'].map(createPackageLink));
  await Promise.all(
    [
      'braid-design-system',
      'sku/treat',
      'sku/react-treat',
      'sku/@loadable/component',
    ].map(createPackageCopy),
  );
}

const port = 9876;
const devServerUrl = `http://localhost:${port}`;

describe('sku-webpack-plugin', () => {
  beforeAll(async () => {
    // "Install" React and braid-design-system into this test app so that webpack-node-externals
    // treats them correctly.
    await setUpLocalDependencies();
  });

  describe('start', () => {
    let process;

    beforeAll(async () => {
      process = spawn('webpack-dev-server', ['--mode development'], {
        cwd: appDir,
      });

      await waitForUrls(devServerUrl);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should start a development server', async () => {
      const snapshot = await getAppSnapshot(devServerUrl);
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('build', () => {
    let closeAssetServer;

    beforeAll(async () => {
      await runBin({
        packageName: 'webpack-cli',
        args: ['--mode production'],
        options: {
          cwd: appDir,
        },
      });

      closeAssetServer = await startAssetServer(port, distDir);
    });

    afterAll(() => {
      closeAssetServer();
    });

    it('should create valid app', async () => {
      const app = await getAppSnapshot(devServerUrl);
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(distDir);
      expect(files).toMatchSnapshot();
    });
  });
});
