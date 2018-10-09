const { promisify } = require('es6-promisify');
const rimrafAsync = promisify(require('rimraf'));
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const gracefulSpawn = require('../../../lib/gracefulSpawn');
const waitForUrls = require('../../utils/waitForUrls');
const fetch = require('node-fetch');
const dirContentsToObject = require('../../utils/dirContentsToObject');
const skuConfig = require('./sku.config');

const backendUrl = `http://localhost:${skuConfig.port.backend}`;
const clientJsUrl = `http://localhost:${skuConfig.port.client}/main.js`;

describe('ssr-hello-world', () => {
  describe('start', () => {
    let server;

    beforeAll(async () => {
      await rimrafAsync(`${__dirname}/dist/`);
      server = await runSkuScriptInDir('start-ssr', __dirname);
      await waitForUrls(backendUrl, clientJsUrl);
    });

    afterAll(() => {
      server.kill();
    });

    it('should start a development server', async () => {
      const response = await fetch(backendUrl);
      const responseText = await response.text();
      expect(responseText).toMatchSnapshot();
    });

    it('should start a static asset server', async () => {
      const response = await fetch(clientJsUrl);
      expect(response.ok).toBe(true);
    });
  });

  describe('build', () => {
    let server;

    beforeAll(async () => {
      await rimrafAsync(`${__dirname}/dist/`);
      await runSkuScriptInDir('build-ssr', __dirname);
      server = gracefulSpawn('node', ['server'], {
        cwd: `${__dirname}/dist`,
        stdio: 'inherit'
      });
      await waitForUrls(backendUrl);
    });

    afterAll(() => {
      server.kill();
    });

    it('should generate a production server', async () => {
      const response = await fetch(backendUrl);
      const responseText = await response.text();
      expect(responseText).toMatchSnapshot();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(`${__dirname}/dist`);
      expect(files).toMatchSnapshot();
    });
  });
});
