import { describe, beforeAll, afterAll, it } from 'vitest';
import { getAppSnapshot } from '@sku-private/vitest-utils';
import path from 'node:path';
import { runSkuScriptInDir, waitForUrls } from '@sku-private/test-utils';

import { createRequire } from 'node:module';
import { createCancelSignal } from '@sku-private/test-utils/process.ts';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/public-path/sku.config.js'),
);

describe('public path', () => {
  describe('build and serve', () => {
    const url = 'http://localhost:4001';
    const { cancel, signal } = createCancelSignal();

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      runSkuScriptInDir('serve', appDir, [], { cancelSignal: signal });
      await waitForUrls(url);
    });

    afterAll(async () => {
      cancel();
    });

    it('should create valid app with no unresolved resources', async ({
      expect,
    }) => {
      const app = await getAppSnapshot({ url, expect });
      expect(app).toMatchSnapshot();
    });
  });
});
