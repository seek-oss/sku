import { describe, it } from 'vitest';
import path from 'node:path';
import { runSkuScriptInDir } from '@sku-private/test-utils';
import { createRequire } from 'node:module';
import { cwd } from 'node:process';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/sku-test/sku.config.ts'),
);

describe('sku-test', () => {
  it.for(['vitest', 'jest'])(
    '[$1]: should run tests',
    async (testRunner, { expect }) => {
      const args =
        testRunner === 'vitest' ? ['--config=sku-config.vitest.ts'] : [];
      await expect(
        runSkuScriptInDir('test', appDir, {
          args,
        }),
      ).resolves.not.toThrowError();
    },
  );

  it('should pass through unknown flags to jest', async ({ expect }) => {
    const child = await runSkuScriptInDir('test', appDir, {
      args: ['--listTests', '--config=sku.config.ts'],
    });
    const output = (child?.stdout as string).replaceAll(cwd(), 'sku');

    expect(output).toMatchSnapshot();
  });
});
