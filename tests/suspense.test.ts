import path from 'node:path';
import {
  dirContentsToObject,
  runSkuScriptInDir,
  waitForUrls,
  getAppSnapshot,
} from '@sku-private/test-utils';
import type { ChildProcess } from 'node:child_process';

const appDir = path.dirname(
  require.resolve('@sku-fixtures/suspense/sku.config.js'),
);

const targetDirectory = `${appDir}/dist`;
const url = `http://localhost:8203`;

describe('suspense', () => {
  describe('build and serve', () => {
    let process: ChildProcess;

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      process = await runSkuScriptInDir('serve', appDir);
      await waitForUrls(url);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should return home page', async () => {
      const app = await getAppSnapshot(url);
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(targetDirectory);
      expect(files).toMatchSnapshot();
    });
  });
});
