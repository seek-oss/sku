const path = require('path');
const dirContentsToObject = require('../test/utils/dirContentsToObject');
const waitForUrls = require('../test/utils/waitForUrls');
const runSkuScriptInDir = require('../test/utils/runSkuScriptInDir');
const { getAppSnapshot } = require('../test/utils/appSnapshot');
const startAssetServer = require('../test/utils/assetServer');
const { getStorybookContent } = require('../test/utils/getStorybookContent');
const gracefulSpawn = require('../lib/gracefulSpawn');
const appDir = path.dirname(
  require.resolve('@fixtures/typescript-css-modules/sku.config'),
);
const distDir = path.resolve(appDir, 'dist');

const srcDir = path.resolve(appDir, 'src');
const ssrSkuConfig = require('@fixtures/typescript-css-modules/sku-ssr.config.js');

const backendUrl = `http://localhost:${ssrSkuConfig.serverPort}`;
const cssTypes = ['.less.d.ts'];

describe('typescript-css-modules', () => {
  describe('build', () => {
    const url = 'http://localhost:8204';
    let process;

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      process = await runSkuScriptInDir('serve', appDir);
      await waitForUrls(url);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should create valid app', async () => {
      const app = await getAppSnapshot(url);
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(distDir);
      const cssTypeFiles = await dirContentsToObject(srcDir, cssTypes);
      expect({
        ...files,
        ...cssTypeFiles,
      }).toMatchSnapshot();
    });
  });

  describe('build-ssr', () => {
    let server, closeAssetServer;

    beforeAll(async () => {
      await runSkuScriptInDir('build-ssr', appDir, [
        '--config=sku-ssr.config.js',
      ]);
      server = gracefulSpawn('node', ['server'], {
        cwd: distDir,
        stdio: 'inherit',
      });
      closeAssetServer = await startAssetServer(4003, distDir);
      await waitForUrls(backendUrl, 'http://localhost:4003');
    });

    afterAll(async () => {
      await server.kill();
      closeAssetServer();
    });

    it('should create valid app', async () => {
      const app = await getAppSnapshot(backendUrl);
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(distDir, ['.js', '.css']);
      const cssTypeFiles = await dirContentsToObject(srcDir, cssTypes);
      expect({
        ...files,
        ...cssTypeFiles,
      }).toMatchSnapshot();
    });
  });

  describe('start', () => {
    const devServerUrl = `http://localhost:8204`;
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('start', appDir);
      await waitForUrls(devServerUrl);
    });

    afterAll(async () => {
      await server.kill();
    });

    it('should start a development server', async () => {
      const snapshot = await getAppSnapshot(devServerUrl);
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('test', () => {
    let exitCode;

    beforeAll(async () => {
      const { childProcess } = await runSkuScriptInDir('test', appDir);
      exitCode = childProcess.exitCode;
    });

    it('should handle Less and css.js in tests', async () => {
      expect(exitCode).toEqual(0);
    });
  });

  describe('lint', () => {
    let exitCode;

    beforeAll(async () => {
      // run build first to ensure typescript declarations are generated
      await runSkuScriptInDir('build', appDir);
      const { childProcess } = await runSkuScriptInDir('lint', appDir);
      exitCode = childProcess.exitCode;
    });

    it('should handle tsc and eslint', async () => {
      expect(exitCode).toEqual(0);
    });
  });

  describe('storybook', () => {
    const storybookUrl = 'http://localhost:8042';
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('storybook', appDir, ['--ci']);
      await waitForUrls(storybookUrl);
    }, 200000);

    afterAll(async () => {
      await server.kill();
    });

    it('should start a storybook server', async () => {
      const { text, fontSize } = await getStorybookContent(
        storybookUrl,
        '[data-automation-text]',
      );

      expect(text).toEqual('Hello World');
      expect(fontSize).toEqual('32px');
    });
  });
});
