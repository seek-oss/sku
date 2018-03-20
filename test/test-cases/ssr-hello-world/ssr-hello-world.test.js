const { promisify } = require('es6-promisify');
const rimrafAsync = promisify(require('rimraf'));
const { exec } = require('child-process-promise');
const spawn = require('../../utils/gracefulSpawn');
const waitOnAsync = promisify(require('wait-on'));
const fetch = require('node-fetch');
const skuConfig = require('./sku.config');

const backendUrl = `http://localhost:${skuConfig.port.backend}`;
const clientJsUrl = `http://localhost:${skuConfig.port.client}/main.js`;

describe('ssr-hello-world', () => {
  describe('start', () => {
    let server;

    beforeAll(async () => {
      await rimrafAsync(`${__dirname}/dist/`);

      server = spawn('node', [`${__dirname}/../../../scripts/start-ssr`], {
        stdio: 'inherit',
        cwd: __dirname
      });
      
      await waitOnAsync({
        resources: [
          backendUrl.replace(/^http/, 'http-get'),
          clientJsUrl.replace(/^http/, 'http-get')
        ],
        headers: {
          accept: 'text/html, application/javascript'
        },
        timeout: 20000
      });
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
      await exec(`node ${__dirname}/../../../scripts/build-ssr`, { cwd: __dirname, stdio: 'inherit' });
      server = spawn('node', ['server'], { cwd: `${__dirname}/dist`, stdio: 'inherit' });
      await waitOnAsync({ resources: [backendUrl.replace(/^http/, 'http-get')], timeout: 10000 });
    });

    afterAll(() => {
      server.kill();
    });

    it('should generate a production server', async () => {
      const response = await fetch(backendUrl);
      const responseText = await response.text();
      expect(responseText).toMatchSnapshot();
    });
  });
});
