const { promisify } = require('es6-promisify');
const rimrafAsync = promisify(require('rimraf'));
const dirContentsToObject = require('../../utils/dirContentsToObject');
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const waitForUrls = require('../../utils/waitForUrls');
const fetch = require('node-fetch');
const skuConfig = require('./sku.config');

describe('hello-world', () => {
  describe('start', () => {
    const devServerUrl = `http://localhost:${skuConfig.port}`;
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('start', __dirname);
      await waitForUrls(devServerUrl);
    });

    afterAll(() => {
      server.kill();
    });

    it('should start a development server', async () => {
      const response = await fetch(devServerUrl);
      const responseText = await response.text();
      expect(responseText).toMatchSnapshot();
    });
  });

  describe('build', () => {
    beforeAll(async () => {
      await rimrafAsync(`${__dirname}/dist/`);
      await runSkuScriptInDir('build', __dirname);
    });
  
    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(`${__dirname}/dist`);
      expect(files).toMatchSnapshot();
    });
  });
});
