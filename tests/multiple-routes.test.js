import { describe, beforeAll, afterAll, it } from 'vitest';
import path from 'node:path';
import {
  dirContentsToObject,
  runSkuScriptInDir,
  waitForUrls,
} from '@sku-private/test-utils';
import { getAppSnapshot } from '@sku-private/vitest-utils';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/multiple-routes/sku.config.js'),
);

const targetDirectory = `${appDir}/dist`;
const url = `http://localhost:8202`;

describe('multiple-routes', () => {
  describe('start', () => {
    let process;

    beforeAll(async () => {
      process = await runSkuScriptInDir('start', appDir);
      await waitForUrls(url);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should render home page correctly', async ({ expect }) => {
      const snapshot = await getAppSnapshot(url);
      expect(snapshot).toMatchSnapshot();
    });

    it('should render details page correctly', async ({ expect }) => {
      const snapshot = await getAppSnapshot(`${url}/details/123`);
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('test', () => {
    it('should handle dynamic imports in tests', async ({ expect }) => {
      const { child } = await runSkuScriptInDir('test', appDir);
      expect(child.exitCode).toEqual(0);
    });
  });

  describe('build and serve', () => {
    let process;

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      process = await runSkuScriptInDir('serve', appDir);
      await waitForUrls(url);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should return home page', async ({ expect }) => {
      const app = await getAppSnapshot(url);
      expect(app).toMatchSnapshot();
    });

    it('should return details page', async ({ expect }) => {
      const app = await getAppSnapshot(`${url}/details/123`);
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async ({ expect }) => {
      const files = await dirContentsToObject(targetDirectory);
      expect(files).toMatchSnapshot();
    });
  });
});
