import { expect, test } from 'vitest';
import path from 'node:path';
import { run } from '@sku-private/test-utils';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/jest-test/sku.config.ts'),
);

test('Jest test with preset', async () => {
  const { child } = await run('jest', [], { cwd: appDir });
  expect(child.exitCode).toEqual(0);
});
