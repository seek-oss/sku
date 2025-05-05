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
  it('should run tests', async ({ expect }) => {
    const child = await runSkuScriptInDir('test', appDir);
    expect(child?.exitCode).toEqual(0);
  });

  it('should pass through unknown flags to jest', async ({ expect }) => {
    const child = await runSkuScriptInDir('test', appDir, ['--listTests']);
    const output = (child?.stdout as string).replaceAll(cwd(), 'sku');

    expect(output).toMatchSnapshot();
  });
});
