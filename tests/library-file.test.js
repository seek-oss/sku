import { describe, beforeAll, afterAll, it } from 'vitest';
import { getAppSnapshot } from '@sku-private/vitest-utils';
import path from 'node:path';
import {
  dirContentsToObject,
  runSkuScriptInDir,
  waitForUrls,
} from '@sku-private/test-utils';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/library-file/sku.config.js'),
);
const distDir = path.resolve(appDir, 'dist');

describe('library-file', () => {
  describe('build', () => {
    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
    });

    it('should generate the expected files', async ({ expect }) => {
      const files = await dirContentsToObject(distDir);
      expect(files).toMatchSnapshot();
    });
  });

  describe('start', () => {
    const devServerUrl = `http://localhost:8086`;
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('start', appDir);
      await waitForUrls(devServerUrl);
    });

    afterAll(async () => {
      await server.kill();
    });

    it('should start a development server', async ({ expect }) => {
      const snapshot = await getAppSnapshot(devServerUrl);
      expect(snapshot).toMatchSnapshot();
    });
  });
});
