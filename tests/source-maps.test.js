import path from 'node:path';

import {
  runSkuScriptInDir,
  dirContentsToObject,
} from '@sku-private/test-utils';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/source-maps/sku.config.mjs'),
);

describe('source-maps', () => {
  describe('build', () => {
    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir, ['--config=sku.config.mjs']);
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(`${appDir}/dist`);
      expect(files).toMatchSnapshot();
    });
  });
});
