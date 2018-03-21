const { promisify } = require('es6-promisify');
const rimrafAsync = promisify(require('rimraf'));
const dirContentsToObject = require('../../utils/dirContentsToObject');
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const waitOnAsync = promisify(require('wait-on'));
const fetch = require('node-fetch');

describe('hello-world', () => {
  describe('start', () => {
    const devServerUrl = 'http://localhost:8080';
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('start', __dirname);
      
      await waitOnAsync({
        resources: [
          devServerUrl.replace(/^http/, 'http-get')
        ],
        timeout: 20000
      });
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
