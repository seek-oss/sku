const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const gracefulSpawn = require('../../../lib/gracefulSpawn');
const waitForUrls = require('../../utils/waitForUrls');
const getAppSnapshot = require('../../utils/getAppSnapshot');
const skuConfig = require('./sku.config');

const backendUrl = `http://localhost:${skuConfig.serverPort}`;

describe('ssr-hello-world', () => {
  describe('start', () => {
    let server;
    beforeAll(async () => {
      server = await runSkuScriptInDir('start-ssr', __dirname);
      await waitForUrls(backendUrl);
    });

    afterAll(() => {
      server.kill();
    });

    it('should start a development server', async () => {
      const snapshot = await getAppSnapshot(backendUrl);
      expect(snapshot).toMatchSnapshot();
    });
  });

  // describe('build', () => {
  //   let server;
  //   beforeAll(async () => {
  //     await runSkuScriptInDir('build-ssr', __dirname);
  //     server = gracefulSpawn('node', ['server'], {
  //       cwd: `${__dirname}/dist`,
  //       stdio: 'inherit'
  //     });
  //     await waitForUrls(backendUrl);
  //   });

  //   afterAll(() => {
  //     server.kill();
  //   });

  //   it('should generate a production server', async () => {
  //     const snapshot = await getAppSnapshot(backendUrl);
  //     expect(snapshot).toMatchSnapshot();
  //   });
  // });
});
