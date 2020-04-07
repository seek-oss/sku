const path = require('path');
const dirContentsToObject = require('../../utils/dirContentsToObject');
const waitForUrls = require('../../utils/waitForUrls');
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const { getAppSnapshot } = require('../../utils/appSnapshot');
const startAssetServer = require('../../utils/assetServer');
const gracefulSpawn = require('../../../lib/gracefulSpawn');
const appDir = path.resolve(__dirname, 'app');
const distDir = path.resolve(appDir, 'dist');
const srcDir = path.resolve(appDir, 'src');
const skuConfig = require('./app/sku.config');

const backendUrl = `http://localhost:${skuConfig.serverPort}`;
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
      await runSkuScriptInDir('build-ssr', appDir);
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
    const storybookUrl = 'http://localhost:8082';
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('storybook', appDir, ['--ci']);
      await waitForUrls(storybookUrl);
    });

    afterAll(async () => {
      await server.kill();
    });

    it('should start a storybook server', async () => {
      const page = await browser.newPage();
      await page.goto(storybookUrl, { waitUntil: 'networkidle2' });

      const content = await page.evaluate(async () => {
        const element = await window.document
          .querySelector('iframe')
          .contentDocument.querySelector('[data-automation-text]');

        const text = element.innerText;
        const styles = window.getComputedStyle(element);
        const fontSize = styles.getPropertyValue('font-size');

        return { text, fontSize };
      });

      expect(content.text).toEqual('Hello World');
      expect(content.fontSize).toEqual('32px');
    });
  });
});
