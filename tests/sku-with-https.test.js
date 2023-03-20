const path = require('path');
const fs = require('fs/promises');
const runSkuScriptInDir = require('../test/utils/runSkuScriptInDir');
const { getAppSnapshot } = require('../test/utils/appSnapshot');
const waitForUrls = require('../test/utils/waitForUrls');

const {
  port,
  serverPort,
} = require('@sku-fixtures/sku-with-https/sku-server.config.js');
const appDir = path.dirname(
  require.resolve('@sku-fixtures/sku-with-https/sku.config.js'),
);

describe('sku-with-https', () => {
  describe('start', () => {
    const url = `https://localhost:${port}`;
    let process;

    beforeAll(async () => {
      process = await runSkuScriptInDir('start', appDir);
      await waitForUrls(url, `${url}/test-middleware`);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should start a development server', async () => {
      const snapshot = await getAppSnapshot(url);
      expect(snapshot).toMatchSnapshot();
    });
    it('should support the supplied middleware', async () => {
      const snapshot = await getAppSnapshot(`${url}/test-middleware`);
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('start-ssr', () => {
    const url = `https://localhost:${serverPort}`;
    let process;

    beforeAll(async () => {
      process = await runSkuScriptInDir('start-ssr', appDir, [
        '--config=sku-server.config.js',
      ]);
      await waitForUrls(url, `${url}/test-middleware`);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should support the supplied middleware', async () => {
      const snapshot = await getAppSnapshot(`${url}/test-middleware`);
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('serve', () => {
    const url = `https://localhost:${port}`;
    let process;

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      process = await runSkuScriptInDir('serve', appDir);
      await waitForUrls(url, `${url}/test-middleware`);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should start a development server', async () => {
      const snapshot = await getAppSnapshot(url);
      expect(snapshot).toMatchSnapshot();
    });

    it('should support the supplied middleware', async () => {
      const snapshot = await getAppSnapshot(`${url}/test-middleware`);
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('.gitignore', () => {
    it('should add the .ssl directory to .gitignore', async () => {
      const ignoreContents = await fs.readFile(
        path.join(appDir, '.gitignore'),
        'utf-8',
      );
      expect(ignoreContents.split('\n')).toContain(`.ssl`);
    });
  });
});
