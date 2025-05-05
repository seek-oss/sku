import { describe, beforeAll, afterAll, it } from 'vitest';
import path from 'node:path';
import {
  dirContentsToObject,
  runSkuScriptInDir,
  waitForUrls,
} from '@sku-private/test-utils';

import { getAppSnapshot } from '@sku-private/vitest-utils';

import { createRequire } from 'node:module';
import { createCancelSignal } from '@sku-private/test-utils/process.ts';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/library-build/sku.config.js'),
);
const distDir = path.resolve(appDir, 'dist');

describe('library-build', () => {
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
    const devServerUrl = `http://localhost:8085`;
    const { cancel, signal } = createCancelSignal();

    beforeAll(async () => {
      runSkuScriptInDir('start', appDir, [], {
        cancelSignal: signal,
      });
      await waitForUrls(devServerUrl);
    });

    afterAll(async () => {
      cancel();
    });

    it('should start a development server', async ({ expect }) => {
      const snapshot = await getAppSnapshot({ url: devServerUrl, expect });
      expect(snapshot).toMatchSnapshot();
    });
  });
});
