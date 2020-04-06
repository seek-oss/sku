const path = require('path');
const { promisify } = require('util');
const rimrafAsync = promisify(require('rimraf'));
const fs = require('fs-extra');
const dirContentsToObject = require('../../utils/dirContentsToObject');
const { getAppSnapshot } = require('../../utils/appSnapshot');
const waitForUrls = require('../../utils/waitForUrls');
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const { getPathFromCwd } = require('../../../lib/cwd');

const skuConfig = require('./app/sku.config');

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

function getLocalUrl(site) {
  const host = site === 'jobStreet' ? 'dev.jobstreet.com' : 'dev.seek.com.au';

  return `http://${host}:${skuConfig.port}`;
}

describe('braid-design-system', () => {
  beforeAll(async () => {
    // "Install" React and braid-design-system into this test app so that webpack-node-externals
    // treats them correctly.
    await setUpLocalDependencies();
  });

  describe('start', () => {
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('start', appDir);
      await waitForUrls(getLocalUrl('seekAnz'));
    });

    afterAll(async () => {
      await server.kill();
    });

    it('should return development seekAnz site', async () => {
      const snapshot = await getAppSnapshot(getLocalUrl('seekAnz'));
      expect(snapshot).toMatchSnapshot();
    });

    it('should return development jobStreet site', async () => {
      const snapshot = await getAppSnapshot(getLocalUrl('jobStreet'));
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('build', () => {
    let server;

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      server = await runSkuScriptInDir('serve', appDir);
      await waitForUrls(getLocalUrl('seekAnz'));
    });

    afterAll(async () => {
      await server.kill();
    });

    it('should return built jobStreet site', async () => {
      const app = await getAppSnapshot(getLocalUrl('jobStreet'));
      expect(app).toMatchSnapshot();
    });

    it('should return built seekAnz site', async () => {
      const app = await getAppSnapshot(getLocalUrl('seekAnz'));
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(distDir);
      expect(files).toMatchSnapshot();
    });
  });

  it('should handle braid-design-system in tests', async () => {
    const { childProcess } = await runSkuScriptInDir('test', appDir);
    expect(childProcess.exitCode).toEqual(0);
  });
});
