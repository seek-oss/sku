import path from 'node:path';
import {
  dirContentsToObject,
  getAppSnapshot,
  waitForUrls,
  runSkuScriptInDir,
} from '@sku-private/test-utils';

import skuConfig from '@sku-fixtures/braid-design-system/sku.config.js';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/braid-design-system/sku.config.js'),
);
const distDir = path.resolve(appDir, 'dist');

function getLocalUrl(site) {
  const host = site === 'jobStreet' ? 'dev.jobstreet.com' : 'dev.seek.com.au';

  return `http://${host}:${skuConfig.port}`;
}

describe('braid-design-system', () => {
  describe.each(['vite', 'webpack'])('bundler %s', (bundler) => {
    const args =
      bundler === 'vite'
        ? ['--config', 'sku.config.vite.js', '--experimental-bundler']
        : [];

    describe('start', () => {
      let server;

      beforeAll(async () => {
        server = await runSkuScriptInDir('start', appDir, args);
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
        await runSkuScriptInDir('build', appDir, args);
        process = await runSkuScriptInDir('serve', appDir, args);
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
  });

  it('should handle braid-design-system in tests', async () => {
    const { child } = await runSkuScriptInDir('test', appDir);
    expect(child.exitCode).toEqual(0);
  });
});
