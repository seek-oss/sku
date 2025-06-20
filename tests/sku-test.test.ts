import { describe, it } from 'vitest';
import path from 'node:path';
import { runSkuScriptInDir } from '@sku-private/test-utils';
import { createRequire } from 'node:module';
import { cwd } from 'node:process';
import { stripVTControlCharacters } from 'node:util';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/sku-test/sku.config.ts'),
);

describe.for(['vitest', 'jest'])('[%s]: sku-test', (testRunner) => {
  const args = testRunner === 'vitest' ? ['--config=sku.config.vitest.ts'] : [];
  it('should run tests', async ({ expect }) => {
    await expect(
      runSkuScriptInDir('test', appDir, {
        args,
      }),
    ).resolves.not.toThrowError();
  });

  it(`should pass through unknown flags to ${testRunner}`, async ({
    expect,
  }) => {
    const child = await runSkuScriptInDir('test', appDir, {
      args: [...args, '--coverage'],
    });
    const output = (child?.stdout as string).replaceAll(cwd(), 'sku');

    expect(
      stripVTControlCharacters(output)
        .replaceAll(/v\d\.\d\.\d /g, '')
        .replaceAll(/(\d+\.?\d*)s|(\d*)ms/g, '0ms')
        .replaceAll(/\b\d{1,2}:\d{2}:\d{2}\b/g, '00:00:00'),
    ).toMatchSnapshot();
  });
});
