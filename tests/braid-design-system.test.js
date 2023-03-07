const path = require('path');
const dirContentsToObject = require('../test/utils/dirContentsToObject');
const { getAppSnapshot } = require('../test/utils/appSnapshot');
const waitForUrls = require('../test/utils/waitForUrls');
const runSkuScriptInDir = require('../test/utils/runSkuScriptInDir');

// eslint-disable-next-line import/no-unresolved
const skuConfig = require('@fixtures/braid-design-system/sku.config.js');

const appDir = path.dirname(
  require.resolve('@fixtures/braid-design-system/sku.config.js'),
);
const distDir = path.resolve(appDir, 'dist');

function getLocalUrl(site) {
  const host = site === 'jobStreet' ? 'dev.jobstreet.com' : 'dev.seek.com.au';

  return `http://${host}:${skuConfig.port}`;
}

describe('braid-design-system', () => {
  describe('start', () => {
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('start', appDir);
      await waitForUrls(getLocalUrl('seekAnz'));
    }, 230000);

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
    let process;

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      process = await runSkuScriptInDir('serve', appDir);
      await waitForUrls(getLocalUrl('seekAnz'));
    }, 230000);

    afterAll(async () => {
      await process.kill();
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
