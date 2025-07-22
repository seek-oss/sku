import { describe, beforeAll, afterAll, it } from 'vitest';
import {
  dirContentsToObject,
  runSkuScriptInDir,
  waitForUrls,
  createCancelSignal,
} from '@sku-private/test-utils';
import path from 'node:path';

const appDir = path.dirname(
  require.resolve('@sku-fixtures/custom-output-target/sku.config.ts'),
);
const distDir = path.resolve(appDir, 'custom-output-directory');

describe('custom-output-target', () => {
  beforeAll(async () => {
    await runSkuScriptInDir('build', appDir);
  });

  it('should generate an output directory with the value specified in sku.config', async ({
    expect,
  }) => {
    const files = await dirContentsToObject(distDir);
    expect(files).toMatchSnapshot();
  });
});
