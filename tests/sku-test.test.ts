import path from 'node:path';
import { runSkuScriptInDir } from '@sku-private/test-utils';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/sku-test/sku.config.ts'),
);

test('sku test', async () => {
  const { child } = await runSkuScriptInDir('test', appDir);
  expect(child.exitCode).toEqual(0);
});
