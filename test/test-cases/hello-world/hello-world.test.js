const { promisify } = require('es6-promisify');
const rimrafAsync = promisify(require('rimraf'));
const dirContentsToObject = require('../../utils/dirContentsToObject');
const { exec } = require('child-process-promise');
const spawn = require('../../utils/gracefulSpawn');
const waitOnAsync = promisify(require('wait-on'));
const fetch = require('node-fetch');

describe('hello-world', () => {
  describe('start', () => {
    const devServerUrl = 'http://localhost:8080';
    let server;

    beforeAll(async () => {
      server = spawn('node', [`${__dirname}/../../../scripts/start`], {
        stdio: 'inherit',
        cwd: __dirname
      });
      
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
      await exec(`node ${__dirname}/../../../scripts/build`, { cwd: __dirname, stdio: 'inherit' });
    });
  
    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(`${__dirname}/dist`);
      expect(files).toMatchSnapshot();
    });
  });
});
